import { createClient } from '@supabase/supabase-js'

async function handler(request, response) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const storageName = process.env.NODE_ENV.startsWith('dev')
    ? 'comments.dev'
    : 'comments'

  try {
    const { author, article, content } = request.body
    const { data, error } = await supabase.from(storageName).insert({
      author,
      article,
      content,
    })
    if (error) {
      console.error(error)
      response.status(400).send({ success: false })
    } else
    response.status(200).send({ success: true })
  } catch (err) {
    console.log(err)
    response.status(400).send({ success: false })
  }
}

export default handler
