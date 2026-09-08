package AYUSH.Case.Taking.Backend.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiTestController {

    private final ChatClient chatClient;

    public AiTestController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @GetMapping("/test")
    public String testGemini() {

        return chatClient
                .prompt()
                .user("Say hello and confirm that Gemini AI is connected to the AYUSH Case Taking backend.")
                .call()
                .content();
    }
}