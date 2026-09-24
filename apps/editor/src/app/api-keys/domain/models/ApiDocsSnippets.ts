export type SnippetLang = 'curl' | 'ts' | 'python';

export function getSnippetTitle(lang: SnippetLang, endpointKey: string): string {
  const langNames: Record<SnippetLang, string> = {
    curl: 'cURL Terminal Command',
    ts: 'TypeScript / Fetch API',
    python: 'Python 3 (requests)',
  };
  return `${langNames[lang]} — ${endpointKey}`;
}

export function getSnippet(lang: SnippetLang, baseUrl: string, endpointKey: string): string {
  if (lang === 'curl') {
    switch (endpointKey) {
      case 'apps':
        return `curl -X GET "${baseUrl}/v1/apps" \\
  -H "Authorization: Bearer crd_live_YOUR_API_KEY" \\
  -H "Accept: application/json"`;
      case 'records':
        return `curl -X GET "${baseUrl}/v1/tables/TABLE_ID/records?limit=50&status=completed" \\
  -H "Authorization: Bearer crd_live_YOUR_API_KEY" \\
  -H "Accept: application/json"`;
      case 'createRecord':
        return `curl -X POST "${baseUrl}/v1/tables/TABLE_ID/records" \\
  -H "Authorization: Bearer crd_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nama_responden": "Budi Santoso",
    "nik": "3201020304050001",
    "pendapatan_bulanan": 5500000
  }'`;
      case 'sync':
        return `curl -X POST "${baseUrl}/v1/tables/TABLE_ID/sync" \\
  -H "Authorization: Bearer crd_live_YOUR_API_KEY" \\
  -H "Accept: application/json"`;
      default:
        return '';
    }
  }

  if (lang === 'ts') {
    switch (endpointKey) {
      case 'apps':
        return `const response = await fetch("${baseUrl}/v1/apps", {
  method: "GET",
  headers: {
    "Authorization": "Bearer crd_live_YOUR_API_KEY",
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log("Apps:", data);`;
      case 'records':
        return `const response = await fetch("${baseUrl}/v1/tables/TABLE_ID/records?limit=50", {
  method: "GET",
  headers: {
    "Authorization": "Bearer crd_live_YOUR_API_KEY",
    "Accept": "application/json"
  }
});
const records = await response.json();`;
      case 'createRecord':
        return `const response = await fetch("${baseUrl}/v1/tables/TABLE_ID/records", {
  method: "POST",
  headers: {
    "Authorization": "Bearer crd_live_YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    nama_responden: "Budi Santoso",
    nik: "3201020304050001",
    pendapatan_bulanan: 5500000
  })
});
const created = await response.json();`;
      case 'sync':
        return `const response = await fetch("${baseUrl}/v1/tables/TABLE_ID/sync", {
  method: "POST",
  headers: {
    "Authorization": "Bearer crd_live_YOUR_API_KEY"
  }
});
const syncJob = await response.json();`;
      default:
        return '';
    }
  }

  // Python
  switch (endpointKey) {
    case 'apps':
      return `import requests

url = "${baseUrl}/v1/apps"
headers = {
    "Authorization": "Bearer crd_live_YOUR_API_KEY",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
print(response.json())`;
    case 'records':
      return `import requests

url = "${baseUrl}/v1/tables/TABLE_ID/records"
headers = {"Authorization": "Bearer crd_live_YOUR_API_KEY"}
params = {"limit": 50, "status": "completed"}

response = requests.get(url, headers=headers, params=params)
records = response.json()`;
    case 'createRecord':
      return `import requests

url = "${baseUrl}/v1/tables/TABLE_ID/records"
headers = {
    "Authorization": "Bearer crd_live_YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "nama_responden": "Budi Santoso",
    "nik": "3201020304050001",
    "pendapatan_bulanan": 5500000
}

response = requests.post(url, headers=headers, json=payload)
print(response.status_code, response.json())`;
    case 'sync':
      return `import requests

url = "${baseUrl}/v1/tables/TABLE_ID/sync"
headers = {"Authorization": "Bearer crd_live_YOUR_API_KEY"}

response = requests.post(url, headers=headers)
print("Sync dispatched:", response.json())`;
    default:
      return '';
  }
}
