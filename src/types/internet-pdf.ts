export interface InternetPdfResult {
  title: string;
  snippet: string;
  pdfUrl: string;
  domain: string;
}

export interface SearchPdfsResponse {
  ok: boolean;
  results: InternetPdfResult[];
  message?: string;
}

export interface IngestUrlResponse {
  ok: boolean;
  message?: string;
}
