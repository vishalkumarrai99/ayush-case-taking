package AYUSH.Case.Taking.Backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.Base64;

@Service
public class BhashiniAsrService {

    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    @Value("${bhashini.enabled:false}")
    private boolean enabled;

    @Value("${bhashini.user-id:}")
    private String userId;

    @Value("${bhashini.api-key:}")
    private String apiKey;

    @Value("${bhashini.pipeline-id:}")
    private String pipelineId;

    @Value("${bhashini.config-url:https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline}")
    private String configUrl;

    @Value("${bhashini.inference-url:https://dhruva-api.bhashini.gov.in/services/inference/pipeline}")
    private String inferenceUrl;

    public BhashiniAsrService() {
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder().build();
    }

    public Map<String, Object> transcribe(
            MultipartFile audio,
            String language
    ) throws IOException {

        if (!enabled) {
            throw new IllegalStateException(
                    "Bhashini ASR is disabled. Set BHASHINI_ENABLED=true."
            );
        }

        if (audio == null || audio.isEmpty()) {
            throw new IllegalArgumentException(
                    "Audio file is empty."
            );
        }

        if (isBlank(userId) || isBlank(apiKey)) {
            throw new IllegalStateException(
                    "Bhashini credentials are not configured."
            );
        }

        String sourceLanguage = normalizeLanguage(language);

        JsonNode config = getPipelineConfig(sourceLanguage);

        JsonNode responseConfig =
                config.path("pipelineResponseConfig");

        JsonNode asrConfig = findAsrConfig(responseConfig);

        if (asrConfig.isMissingNode() || asrConfig.isNull()) {
            throw new IllegalStateException(
                    "Bhashini ASR service configuration was not found."
            );
        }

        String serviceId =
                text(asrConfig, "serviceId");

        if (isBlank(serviceId)) {
            serviceId = text(asrConfig, "modelId");
        }

        if (isBlank(serviceId)) {
            throw new IllegalStateException(
                    "Bhashini ASR service ID was not returned."
            );
        }

        JsonNode endpoint =
                config.path("pipelineInferenceAPIEndPoint");

        String callbackUrl =
                text(endpoint, "callbackUrl");

        if (isBlank(callbackUrl)) {
            callbackUrl = inferenceUrl;
        }

        JsonNode inferenceKeyNode =
                endpoint.path("inferenceApiKey");

        String inferenceKey =
                text(inferenceKeyNode, "value");

        if (isBlank(inferenceKey)) {
            throw new IllegalStateException(
                    "Bhashini inference API key was not returned by pipeline configuration."
            );
        }

        String base64Audio =
                Base64.getEncoder().encodeToString(audio.getBytes());

        Map<String, Object> task = new LinkedHashMap<>();

        task.put(
                "taskType",
                "asr"
        );

        task.put(
                "config",
                Map.of(
                        "language",
                        Map.of("sourceLanguage", sourceLanguage),
                        "serviceId",
                        serviceId,
                        "audioFormat",
                        "wav",
                        "samplingRate",
                        16000
                )
        );

        task.put(
                "inputData",
                Map.of(
                        "audio",
                        List.of(
                                Map.of(
                                        "audioContent",
                                        base64Audio
                                )
                        )
                )
        );

        Map<String, Object> request =
                Map.of(
                        "pipelineTasks",
                        List.of(task)
                );

        String rawResponse =
                restClient.post()
                        .uri(callbackUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(
                                "Authorization",
                                inferenceKey
                        )
                        .body(request)
                        .retrieve()
                        .body(String.class);

        if (isBlank(rawResponse)) {
            throw new IllegalStateException(
                    "Bhashini returned an empty response."
            );
        }

        JsonNode root =
                objectMapper.readTree(rawResponse);

        String transcript =
                extractTranscript(root);

        if (isBlank(transcript)) {
            throw new IllegalStateException(
                    "Bhashini response received, but transcript was empty."
            );
        }

        return Map.of(
                "success",
                true,
                "text",
                transcript,
                "language",
                sourceLanguage,
                "provider",
                "Bhashini",
                "serviceId",
                serviceId
        );
    }

    private JsonNode getPipelineConfig(
            String sourceLanguage
    ) throws IOException {

        Map<String, Object> request =
                new LinkedHashMap<>();

        request.put("pipelineId", pipelineId);

        request.put(
                "pipelineRequestConfig",
                List.of(
                        Map.of(
                                "taskType",
                                "asr",
                                "config",
                                Map.of(
                                        "language",
                                        Map.of(
                                                "sourceLanguage",
                                                sourceLanguage
                                        )
                                )
                        )
                )
        );

        String response =
                restClient.post()
                        .uri(configUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("userID", userId)
                        .header("ulcaApiKey", apiKey)
                        .body(request)
                        .retrieve()
                        .body(String.class);

        if (isBlank(response)) {
            throw new IllegalStateException(
                    "Bhashini pipeline configuration returned an empty response."
            );
        }

        return objectMapper.readTree(response);
    }

    private JsonNode findAsrConfig(JsonNode configs) {

        if (!configs.isArray()) {
            return configs;
        }

        for (JsonNode item : configs) {
            String taskType =
                    text(item, "taskType");

            if ("asr".equalsIgnoreCase(taskType)) {
                return item;
            }
        }

        return MissingNodeHolder.MISSING;
    }

    private String extractTranscript(JsonNode root) {

        List<JsonNode> candidates =
                List.of(
                        root.path("pipelineResponse"),
                        root.path("data"),
                        root
                );

        for (JsonNode candidate : candidates) {
            String result =
                    findText(candidate);

            if (!isBlank(result)) {
                return result.trim();
            }
        }

        return "";
    }

    private String findText(JsonNode node) {

        if (node == null || node.isMissingNode()) {
            return "";
        }

        if (node.isTextual()) {
            return node.asText();
        }

        if (node.isObject()) {
            for (String key : List.of(
                    "source",
                    "text",
                    "transcript",
                    "target"
            )) {
                JsonNode value = node.get(key);

                if (value != null && value.isTextual()) {
                    return value.asText();
                }
            }

            Iterator<JsonNode> values = node.elements();

            while (values.hasNext()) {
                String result = findText(values.next());

                if (!isBlank(result)) {
                    return result;
                }
            }
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                String result = findText(child);

                if (!isBlank(result)) {
                    return result;
                }
            }
        }

        return "";
    }

    private String normalizeLanguage(String language) {

        if (isBlank(language)) {
            return "hi";
        }

        String value =
                language.trim().toLowerCase(Locale.ROOT);

        if (value.contains("-")) {
            value = value.substring(0, value.indexOf("-"));
        }

        return switch (value) {
            case "hi" -> "hi";
            case "en" -> "en";
            case "bn" -> "bn";
            case "mr" -> "mr";
            case "te" -> "te";
            case "ta" -> "ta";
            case "gu" -> "gu";
            case "kn" -> "kn";
            case "ml" -> "ml";
            case "pa" -> "pa";
            case "or" -> "or";
            case "as" -> "as";
            default -> throw new IllegalArgumentException(
                    "Unsupported Bhashini language: " + language
            );
        };
    }

    private String text(
            JsonNode node,
            String field
    ) {
        JsonNode value = node.get(field);

        return value != null && value.isValueNode()
                ? value.asText("")
                : "";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static class MissingNodeHolder {
        private static final JsonNode MISSING =
                com.fasterxml.jackson.databind.node.MissingNode.getInstance();
    }
}
