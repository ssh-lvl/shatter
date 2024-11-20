const SUPABASE_URL = 'https://fffwukshwgrcdyqmvahg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZnd1a3Nod2dyY2R5cW12YWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzOTkxMjAsImV4cCI6MjA0Njk3NTEyMH0.MsMeFMkrJCeJzRFWMZXM-CZu8gwaScV7feentsgMQvI';

async function fetchData(tableName) {
    const response = await fetch(`https://your-api-url/${tableName}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(data);  // Log to verify if it’s an array
    return data;
}
