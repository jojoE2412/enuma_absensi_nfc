import { useEffect } from 'react'
import { supabase } from './lib/supabase'

function App() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      console.log('Data profiles:', data)
      console.log('Jumlah data:', data?.length)
      console.log('Error:', error)
    }

    testConnection()
  }, [])

  return <h1>Absensi NFC</h1>
}

export default App