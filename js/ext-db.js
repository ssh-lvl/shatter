const SUPABASE_URL = 'https://fffwukshwgrcdyqmvahg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZnd1a3Nod2dyY2R5cW12YWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzOTkxMjAsImV4cCI6MjA0Njk3NTEyMH0.MsMeFMkrJCeJzRFWMZXM-CZu8gwaScV7feentsgMQvI';

// Function to fetch data from Supabase
export async function fetchData(table) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'GET',  // HTTP Method (GET for reading data)
      headers: {
        'Content-Type': 'application/json',  // The content type we expect
        'apikey': SUPABASE_KEY,              // The API key for authorization
        'Authorization': `Bearer ${SUPABASE_KEY}` // Authorization with API key
      }
    });

    // Check if the response is okay (status 200)
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    // Parse and return the data as JSON
    const data = await response.json();
    return data;
  } catch (error) {
    // Return the error message if something went wrong
    return { error: error.message };
  }
}
