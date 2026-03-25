// Cloudflare Pages edge function to bypass CORS
export async function onRequest() {
  const SJC_URL = 'https://sjc.com.vn/xml/tygiavang.xml'

  try {
    const response = await fetch(SJC_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/xml, text/xml, */*',
      },
    })

    if (!response.ok) {
      return new Response('Lỗi kết nối từ máy chủ SJC', { status: response.status })
    }

    const xmlText = await response.text()

    return new Response(xmlText, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown Serverless Error'
    return new Response(errorMessage, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}
