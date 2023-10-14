import { createClient } from '@supabase/supabase-js'

export default async function handler(request, response) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )
    const storageName = process.env.NODE_ENV.startsWith('dev')
      ? 'comments.dev'
      : 'comments'
    const { data, error } = (
      await supabase
        .from(storageName)
        .select(
          `created_at, content, author ( user_name, avatar )`
        )
        .eq('article', request.body)
    )
    if (error) console.error(error)
    response.status(200).json({ data })
  } catch (error) {
    console.error(error)
    response.status(400).json({ message: 'Failed to fetch comments.' })
  }
}
