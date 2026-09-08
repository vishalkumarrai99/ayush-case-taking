import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { saveMedicalDocuments } from '../../store/slices/caseSlice'
import LanguageSelector from '../../components/common/LanguageSelector'
import { usePatientLanguage } from '../../context/PatientLanguageContext'
import {
  getMyCases,
  getCaseMedicalDocuments,
  uploadMedicalDocument,
} from '../../services/api'

function MedicalDocuments() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)
  const { t, language } = usePatientLanguage()

  const tx = (text) => t(text)

  const [documents, setDocuments] = useState([])
  const [currentCaseId, setCurrentCaseId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
  ]

  const maxFileSize = 10 * 1024 * 1024

  const documentTypes = [
    'Prescription',
    'Lab Report',
    'Discharge Summary',
    'Medical Imaging',
    'Previous Case Record',
    'Other',
  ]

  useEffect(() => {
    initializeDocuments()
  }, [])

  // ---------------------------------------------------------
  // FIND LATEST PATIENT CASE
  // ---------------------------------------------------------

  const getCaseDate = (caseItem) => {
    const value =
      caseItem?.submittedAt ||
      caseItem?.createdAt ||
      caseItem?.updatedAt

    if (!value) return 0

    const timestamp = new Date(value).getTime()

    return Number.isNaN(timestamp) ? 0 : timestamp
  }

  const findLatestCase = (cases) => {
    if (!Array.isArray(cases) || cases.length === 0) {
      return null
    }

    return [...cases].sort((a, b) => {
      const dateDifference = getCaseDate(b) - getCaseDate(a)

      if (dateDifference !== 0) {
        return dateDifference
      }

      return Number(b?.id || 0) - Number(a?.id || 0)
    })[0]
  }

  // ---------------------------------------------------------
  // NORMALIZE SERVER DOCUMENT
  // ---------------------------------------------------------

  const normalizeServerDocument = (document) => ({
    ...document,

    id: document?.id,

    name:
      document?.fileName ||
      document?.name ||
      'Medical document',

    fileName:
      document?.fileName ||
      document?.name ||
      'Medical document',

    size: document?.size || 0,

    type:
      document?.fileType ||
      document?.contentType ||
      document?.type ||
      '',

    documentType:
      document?.documentType ||
      'Other',

    title:
      document?.title ||
      document?.fileName ||
      'Medical document',

    status: 'Uploaded',

    uploadStatus: 'UPLOADED',

    ocrStatus:
      document?.ocrStatus ||
      (document?.extractedText
        ? 'OCR Completed'
        : 'Processing Completed'),

    ocrText:
      document?.extractedText ||
      document?.ocrText ||
      '',

    aiSummary:
      document?.aiSummary ||
      '',

    uploadedAt:
      document?.uploadedAt ||
      null,

    serverDocument: true,
  })

  // ---------------------------------------------------------
  // INITIALIZE
  // ---------------------------------------------------------

  const initializeDocuments = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // First get patient's cases
      const casesResponse = await getMyCases()

      const cases = Array.isArray(casesResponse)
        ? casesResponse
        : casesResponse?.cases ||
          casesResponse?.data ||
          casesResponse?.content ||
          []

      const latestCase = findLatestCase(cases)

      // No case
      if (!latestCase?.id) {
        setCurrentCaseId(null)
        setDocuments([])

        setError(
          'No patient case was found. Please complete and submit a patient case before uploading medical documents.'
        )

        return
      }

      // IMPORTANT:
      // This is the case ID which backend requires.
      const caseId = latestCase.id

      setCurrentCaseId(caseId)

      console.log('Medical Documents - Current Case ID:', caseId)

      // Get documents belonging to this case
      const documentsResponse =
        await getCaseMedicalDocuments(caseId)

      const serverDocuments = Array.isArray(documentsResponse)
        ? documentsResponse
        : documentsResponse?.documents ||
          documentsResponse?.data ||
          []

      setDocuments(
        serverDocuments.map(normalizeServerDocument)
      )
    } catch (err) {
      console.error(
        'Could not load patient case/documents:',
        err
      )

      setDocuments([])

      setError(
        err?.message ||
          'Could not load your patient case or medical documents.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------
  // CREATE LOCAL DOCUMENT
  // ---------------------------------------------------------

  const createLocalDocument = (file) => ({
    id: `local-${file.name}-${file.lastModified}-${Math.random()}`,

    file,

    name: file.name,

    fileName: file.name,

    size: file.size,

    type: file.type,

    documentType: 'Other',

    title: '',

    status: 'Ready to Upload',

    uploadStatus: 'READY',

    ocrStatus: 'OCR Not Processed',

    serverDocument: false,
  })

  // ---------------------------------------------------------
  // SELECT FILES
  // ---------------------------------------------------------

  const handleFiles = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    )

    setError('')
    setSuccess('')

    if (!currentCaseId) {
      setError(
        'A patient case is required before uploading a medical document. Please submit a case first.'
      )

      event.target.value = ''

      return
    }

    const validFiles = []

    for (const file of selectedFiles) {
      const normalizedType =
        file.type === 'image/jpg'
          ? 'image/jpeg'
          : file.type

      if (
        !allowedTypes.includes(file.type) &&
        !allowedTypes.includes(normalizedType)
      ) {
        setError(
          `${file.name} is not supported. Please upload PDF, JPG or PNG.`
        )

        continue
      }

      if (file.size > maxFileSize) {
        setError(
          `${file.name} is larger than 10 MB. Please upload a smaller file.`
        )

        continue
      }

      validFiles.push(
        createLocalDocument(file)
      )
    }

    if (validFiles.length > 0) {
      setDocuments((previous) => [
        ...previous,
        ...validFiles,
      ])
    }

    event.target.value = ''
  }

  // ---------------------------------------------------------
  // REMOVE
  // ---------------------------------------------------------

  const removeDocument = (id) => {
    setDocuments((previous) =>
      previous.filter(
        (document) => document.id !== id
      )
    )
  }

  // ---------------------------------------------------------
  // UPDATE TITLE
  // ---------------------------------------------------------

  const updateDocumentTitle = (
    id,
    title
  ) => {
    setDocuments((previous) =>
      previous.map((document) =>
        document.id === id
          ? {
              ...document,
              title,
            }
          : document
      )
    )
  }

  // ---------------------------------------------------------
  // UPDATE TYPE
  // ---------------------------------------------------------

  const updateDocumentType = (
    id,
    documentType
  ) => {
    setDocuments((previous) =>
      previous.map((document) =>
        document.id === id
          ? {
              ...document,
              documentType,
            }
          : document
      )
    )
  }

  // ---------------------------------------------------------
  // FILE SIZE
  // ---------------------------------------------------------

  const formatFileSize = (bytes = 0) => {
    if (!bytes) {
      return 'Size unavailable'
    }

    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`
  }

  // ---------------------------------------------------------
  // FILE ICON
  // ---------------------------------------------------------

  const getFileIcon = (type = '') => {
    if (type.includes('pdf')) {
      return '📕'
    }

    return '🖼️'
  }

  // ---------------------------------------------------------
  // STATUS BADGE
  // ---------------------------------------------------------

  const getStatusBadge = (
    document
  ) => {
    if (
      document.uploadStatus ===
        'UPLOADED' ||
      document.status === 'Uploaded'
    ) {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          ✓ Uploaded
        </span>
      )
    }

    if (
      document.uploadStatus ===
      'UPLOADING'
    ) {
      return (
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          Uploading...
        </span>
      )
    }

    if (
      document.uploadStatus ===
      'FAILED'
    ) {
      return (
        <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
          Upload Failed
        </span>
      )
    }

    return (
      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
        Ready to Upload
      </span>
    )
  }

  // ---------------------------------------------------------
  // UPLOAD SINGLE DOCUMENT
  // ---------------------------------------------------------

  const uploadDocument = async (
    document
  ) => {
    if (!currentCaseId) {
      setError(
        'Case ID is missing. Please submit a patient case first.'
      )

      return
    }

    if (!document.file) {
      setError(
        'The selected file is no longer available.'
      )

      return
    }

    setUploadingId(document.id)

    setError('')
    setSuccess('')

    setDocuments((previous) =>
      previous.map((item) =>
        item.id === document.id
          ? {
              ...item,
              uploadStatus:
                'UPLOADING',
              status: 'Uploading',
              ocrStatus:
                'Uploading & processing...',
            }
          : item
      )
    )

    try {
      console.log(
        'Uploading document to Case ID:',
        currentCaseId
      )

      /*
       * IMPORTANT
       *
       * Backend:
       *
       * POST /api/documents/upload/{caseId}
       *
       * Multipart:
       * file = selected file
       *
       * Case ID is now explicitly passed.
       */

      const response =
        await uploadMedicalDocument({
          caseId: currentCaseId,
          file: document.file,
        })

      console.log(
        'Medical document upload response:',
        response
      )

      const uploadedDocument =
        response?.document ||
        response?.data ||
        response

      const finalDocument =
        normalizeServerDocument({
          ...uploadedDocument,

          title:
            uploadedDocument?.title ||
            document.title ||
            document.name,

          documentType:
            uploadedDocument?.documentType ||
            document.documentType ||
            'Other',
        })

      setDocuments((previous) =>
        previous.map((item) =>
          item.id === document.id
            ? {
                ...item,

                ...finalDocument,

                id:
                  finalDocument.id ||
                  item.id,

                file: item.file,

                name:
                  finalDocument.name ||
                  item.name,

                size:
                  finalDocument.size ||
                  item.size,

                type:
                  finalDocument.type ||
                  item.type,

                title:
                  finalDocument.title ||
                  item.title,

                documentType:
                  finalDocument.documentType ||
                  item.documentType,

                uploadStatus:
                  'UPLOADED',

                status:
                  'Uploaded',

                ocrStatus:
                  finalDocument.ocrText ||
                  finalDocument.aiSummary
                    ? 'OCR / AI Processing Completed'
                    : 'Processing Completed',
              }
            : item
        )
      )

      setSuccess(
        `${
          document.title ||
          document.name
        } uploaded successfully to Case #${currentCaseId}.`
      )

      // Refresh from backend
      try {
        const refreshedResponse =
          await getCaseMedicalDocuments(
            currentCaseId
          )

        const refreshedDocuments =
          Array.isArray(
            refreshedResponse
          )
            ? refreshedResponse
            : refreshedResponse?.documents ||
              refreshedResponse?.data ||
              []

        setDocuments(
          refreshedDocuments.map(
            normalizeServerDocument
          )
        )
      } catch (refreshError) {
        console.warn(
          'Document uploaded but refresh failed:',
          refreshError
        )
      }
    } catch (err) {
      console.error(
        'Medical document upload failed:',
        err
      )

      setDocuments((previous) =>
        previous.map((item) =>
          item.id === document.id
            ? {
                ...item,
                uploadStatus:
                  'FAILED',
                status:
                  'Upload Failed',
                ocrStatus:
                  'OCR Not Processed',
              }
            : item
        )
      )

      setError(
        err?.message ||
          `Could not upload ${document.name}. Please try again.`
      )
    } finally {
      setUploadingId(null)
    }
  }

  // ---------------------------------------------------------
  // UPLOAD ALL
  // ---------------------------------------------------------

  const uploadAllDocuments =
    async () => {
      setError('')
      setSuccess('')

      if (!currentCaseId) {
        setError(
          'A patient case is required before uploading medical documents.'
        )

        return
      }

      const readyDocuments =
        documents.filter(
          (document) =>
            document.file &&
            document.uploadStatus !==
              'UPLOADED' &&
            document.status !==
              'Uploaded'
        )

      if (
        readyDocuments.length === 0
      ) {
        setError(
          'There are no new documents ready for upload.'
        )

        return
      }

      for (
        const document of readyDocuments
      ) {
        await uploadDocument(
          document
        )
      }
    }

  // ---------------------------------------------------------
  // SAVE LOCAL WORKFLOW DATA
  // ---------------------------------------------------------

  const handleContinue = () => {
    const preparedDocuments =
      documents.map((document) => ({
        id: document.id,

        name:
          document.name ||
          document.fileName ||
          'Medical document',

        size:
          document.size || 0,

        type:
          document.type ||
          document.contentType ||
          '',

        documentType:
          document.documentType ||
          'Other',

        title:
          document.title || '',

        status:
          document.status ||
          'Ready to Upload',

        uploadStatus:
          document.uploadStatus ||
          'READY',

        ocrStatus:
          document.ocrStatus ||
          'OCR Not Processed',

        ocrText:
          document.ocrText ||
          document.extractedText ||
          '',

        aiSummary:
          document.aiSummary ||
          '',

        uploadedAt:
          document.uploadedAt ||
          null,

        caseId:
          currentCaseId,
      }))

    dispatch(
      saveMedicalDocuments(
        preparedDocuments
      )
    )

    setSuccess(
      `Medical document information saved for Case #${currentCaseId}.`
    )
  }

  // ---------------------------------------------------------
  // PREVIEW LOCAL FILE
  // ---------------------------------------------------------

  const openDocument = (
    document
  ) => {
    if (!document.file) {
      setError(
        'Preview is available for newly selected files.'
      )

      return
    }

    const url =
      URL.createObjectURL(
        document.file
      )

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    )

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 60000)
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/patient/dashboard'
                )
              }
              className="text-left"
            >
              <p className="text-2xl font-bold text-slate-900">
                AYUSH Care
              </p>

              <p className="text-sm text-slate-500">
                Medical Document Center
              </p>
            </button>

            <div className="flex items-center gap-3"><LanguageSelector compact /><button
              type="button"
              onClick={() =>
                navigate(
                  '/patient/dashboard'
                )
              }
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              {tx('← Dashboard')}
            </button></div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* INTRO */}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
                📄 Medical Document Digitization
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
                Upload Your Medical Documents
              </h1>

              <p className="mt-3 text-slate-600 max-w-2xl leading-7">
                Upload prescriptions,
                laboratory reports,
                discharge summaries
                and other medical
                records. Documents
                are securely attached
                to your current
                patient case.
              </p>
            </div>

            {/* CASE CARD */}

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 min-w-[240px]">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Current Patient Case
              </p>

              {loading ? (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Finding latest case...
                </p>
              ) : currentCaseId ? (
                <>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    #{currentCaseId}
                  </p>

                  <p className="mt-1 text-sm text-emerald-600 font-semibold">
                    ✓ Ready for documents
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  No case found
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">
                ⚠️
              </span>

              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">
                ✓
              </span>

              <p className="text-sm font-medium text-emerald-700">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* UPLOAD AREA */}

        <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFiles}
            className="hidden"
          />

          <button
            type="button"
            disabled={
              !currentCaseId ||
              loading
            }
            onClick={() =>
              fileInputRef.current?.click()
            }
            className={`w-full rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition ${
              !currentCaseId ||
              loading
                ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400'
            }`}
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">
              📤
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              Choose Medical Files
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {currentCaseId
                ? 'Select one or multiple prescriptions, reports or medical documents.'
                : 'Submit a patient case first to enable medical document upload.'}
            </p>

            <span className="inline-block mt-5 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm">
              Choose Files
            </span>
          </button>

          <div className="mt-4 flex flex-wrap gap-2">
            {documentTypes.map(
              (type) => (
                <span
                  key={type}
                  className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"
                >
                  {type}
                </span>
              )
            )}
          </div>
        </section>

        {/* LOADING */}

        {loading && (
          <section className="mt-6 bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="mx-auto w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

            <p className="mt-4 text-sm text-slate-500">
              Loading your current case
              and medical documents...
            </p>
          </section>
        )}

        {/* DOCUMENTS */}

        {!loading &&
          documents.length > 0 && (
            <section className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Your Documents
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Documents are
                    connected to Case #
                    {currentCaseId}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    uploadAllDocuments
                  }
                  disabled={
                    uploadingId !==
                      null ||
                    !documents.some(
                      (document) =>
                        document.file &&
                        document.uploadStatus !==
                          'UPLOADED'
                    )
                  }
                  className={`px-5 py-3 rounded-xl font-semibold transition ${
                    uploadingId !==
                      null ||
                    !documents.some(
                      (document) =>
                        document.file &&
                        document.uploadStatus !==
                          'UPLOADED'
                    )
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  ☁️ Upload All
                  Documents
                </button>
              </div>

              <div className="space-y-5">
                {documents.map(
                  (
                    document,
                    index
                  ) => (
                    <article
                      key={
                        document.id ||
                        index
                      }
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                              {getFileIcon(
                                document.type ||
                                  document.contentType ||
                                  ''
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-800 break-words">
                                {document.title ||
                                  document.name ||
                                  document.fileName ||
                                  `Document ${
                                    index +
                                    1
                                  }`}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500 break-all">
                                {document.name ||
                                  document.fileName ||
                                  'Medical document'}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {getStatusBadge(
                                  document
                                )}

                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                                  {document.ocrStatus ||
                                    'OCR Not Processed'}
                                </span>

                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                                  {formatFileSize(
                                    document.size
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {document.file && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDocument(
                                    document
                                  )
                                }
                                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                              >
                                👁 Preview
                              </button>
                            )}

                            {document.uploadStatus !==
                              'UPLOADED' &&
                              document.status !==
                                'Uploaded' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    uploadDocument(
                                      document
                                    )
                                  }
                                  disabled={
                                    uploadingId ===
                                    document.id
                                  }
                                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                    uploadingId ===
                                    document.id
                                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {uploadingId ===
                                  document.id
                                    ? 'Processing...'
                                    : 'Upload'}
                                </button>
                              )}

                            {document.file && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeDocument(
                                    document.id
                                  )
                                }
                                disabled={
                                  uploadingId ===
                                  document.id
                                }
                                className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* METADATA */}

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Document Title
                            </label>

                            <input
                              type="text"
                              value={
                                document.title ||
                                ''
                              }
                              disabled={
                                document.serverDocument
                              }
                              onChange={(
                                event
                              ) =>
                                updateDocumentTitle(
                                  document.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="e.g. Blood Test Report - May 2026"
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Document Type
                            </label>

                            <select
                              value={
                                document.documentType ||
                                'Other'
                              }
                              disabled={
                                document.serverDocument
                              }
                              onChange={(
                                event
                              ) =>
                                updateDocumentType(
                                  document.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                            >
                              {documentTypes.map(
                                (
                                  type
                                ) => (
                                  <option
                                    key={
                                      type
                                    }
                                    value={
                                      type
                                    }
                                  >
                                    {
                                      type
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </div>

                        {/* OCR / AI */}

                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                                OCR / AI Processing
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-700">
                                {document.ocrStatus ||
                                  'OCR Not Processed'}
                              </p>
                            </div>

                            <span className="text-xs text-slate-500">
                              Case #
                              {
                                currentCaseId
                              }
                            </span>
                          </div>

                          {document.ocrText && (
                            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                              <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                                Extracted Text
                              </p>

                              <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                                {
                                  document.ocrText
                                }
                              </p>
                            </div>
                          )}

                          {document.aiSummary && (
                            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                              <p className="text-xs uppercase tracking-wide font-bold text-blue-600">
                                AI Document
                                Summary
                              </p>

                              <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                                {
                                  document.aiSummary
                                }
                              </p>

                              <p className="mt-3 text-xs text-blue-700">
                                AI output is
                                assistive
                                information
                                and must be
                                reviewed by
                                a qualified
                                doctor before
                                clinical
                                decisions.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          )}

        {/* EMPTY STATE */}

        {!loading &&
          currentCaseId &&
          documents.length === 0 && (
            <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                📂
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-800">
                No Medical
                Documents Yet
              </h2>

              <p className="mt-2 max-w-lg mx-auto text-sm leading-6 text-slate-500">
                Your current patient
                case is{' '}
                <strong>
                  #{currentCaseId}
                </strong>
                . Choose a
                prescription,
                laboratory report,
                discharge summary
                or previous medical
                record above.
              </p>
            </section>
          )}

        {/* SAVE */}

        {documents.length > 0 && (
          <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Save to Patient Case
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Save the document
                  information to the
                  current patient
                  workflow.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleContinue
                }
                className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
              >
                Save Documents
              </button>
            </div>
          </section>
        )}

        {/* PRIVACY */}

        <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">
              🔒
            </span>

            <div>
              <h3 className="font-bold text-blue-900">
                Medical Privacy Notice
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Upload only documents
                belonging to you.
                Uploaded medical records
                are attached to your
                patient case. OCR and
                AI-generated information
                should be reviewed by a
                qualified doctor before
                clinical decisions are
                made.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            AYUSH Care • Patient Case-Taking Platform
          </p>
        </div>
      </footer>
    </div>
  )
}

export default MedicalDocuments