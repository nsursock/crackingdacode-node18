import { createClient } from '@supabase/supabase-js'

export default async function handler(request, response) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )
    const storageName = process.env.NODE_ENV.startsWith('dev')
      ? 'contact.dev'
      : 'contact'
    const data = (await supabase.from(storageName).select()).data
    response.status(200).json({ data })
  } catch (error) {
    console.log(error);
    response.status(400).json({ message: 'Failed to fetch messages.' })
  }
}
