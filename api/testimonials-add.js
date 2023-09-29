import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

async function handler(req, res) {
  const form = new formidable.IncomingForm()
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const storageName = process.env.NODE_ENV.startsWith('dev')
    ? 'testimonials.dev'
    : 'testimonials'

  const uploadFile = async () => {
    // eslint-disable-next-line
    return new Promise((resolve, reject) => {
      form.parse(req, async function (err, fields, files) {
        let filepath = `public/${
          files.picture.newFilename
        }.${files.picture.mimetype.split('/').pop()}`
        // filepath = filepath.replace(/\s/g, '-') // IN CASE YOU NEED TO REPLACE SPACE OF THE IMAGE NAME
        const rawData = fs.readFileSync(files.picture.filepath)
        const { error } = await supabase.storage
          .from(storageName)
          .upload(filepath, rawData, {
            contentType: files.picture.mimetype,
          })

        if (error || err) {
          return reject({ success: false })
        }
        // YOU DO NOT NEED BELOW UNLESS YOU WANT TO SAVE PUBLIC URL OF THE IMAGE TO THE DATABASE
        await supabase.from(storageName).insert({
          description: fields.description,
          name: fields.identity.split('/')[0].trim(),
          occupation: fields.identity.split('/')[1].trim(),
          picture: `https://qroiybphgipjhkmfsvnj.supabase.co/storage/v1/object/public/${storageName}/${filepath}`,
        })

        resolve({ success: true })
      })
    })
  }

  try {
    await uploadFile()
    res.status(200).send({ success: true })
  } catch (err) {
    res.status(400).send({ success: false })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handler
