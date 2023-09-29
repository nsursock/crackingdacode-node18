import { createClient } from '@supabase/supabase-js'

async function handler(request, response) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const { table, data } = JSON.parse(request.body)

  const storageName = process.env.NODE_ENV.startsWith('dev')
    ? table + '.dev'
    : table

  try {
    await supabase.from(storageName).insert(data)
    response.status(200).send({ success: true })
  } catch (err) {
    console.log(err)
    response.status(400).send({ success: false })
  }
}

export default handler

