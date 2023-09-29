import { createClient } from '@supabase/supabase-js'
const jwt = require('jsonwebtoken')
const argon2 = require('argon2')

export default async function handler(request, response) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )
  const storageName = process.env.NODE_ENV.startsWith('dev')
    ? 'users.dev'
    : 'users'

  try {
    switch (request.query.mode) {

      case 'me':
        var decoded = jwt.decode(request.body)
        response.status(201).send({
          success: true,
          user: (
            await supabase.from(storageName).select().eq('email', decoded.email)
          ).data[0],
        })
        break;

      case 'login':
        try {
          const { email, password } = request.body
          const data = (await supabase.from(storageName).select().eq('email', email))
            .data
          if (data.length === 0) {
            response
              .status(400)
              .send({ success: false, error: 'User with this email not found' })
          } else {
            if (await argon2.verify(data[0].password, password)) {
              // password match
              const token = jwt.sign(
                { userId: data[0].id, email: data[0].email },
                process.env.APP_SECRET,
                {
                  expiresIn: '6h',
                }
              )
              data[0].token = token
              response.status(201).send({ success: true, user: data[0] })
            } else {
              // password did not match
              response
                .status(400)
                .send({ success: false, error: 'The password provided was invalid' })
            }
          }
        } catch (error) {
          console.log(error)
          response
            .status(400)
            .send({ success: false, error: 'Sorry, an error occurred' })
        }
        break;

      case 'signup':
        try {
          const { email, name, password } = request.body
          if (
            (await supabase.from(storageName).select().eq('email', email)).data
              .length > 0
          )
            response
              .status(400)
              .send({ success: false, error: 'Email already taken by another user' })
          else {
            if (password.length < 8)
              response.status(400).send({
                success: false,
                error: 'Password should be min 8 characters',
              })
            else {
              const hash = await argon2.hash(password)
              const { data, error } = await supabase.from(storageName).insert({
                email,
                name,
                password: hash,
              })

              if (error) throw new Error(error)
              const token = jwt.sign(
                { userId: data[0].id, email: data[0].email },
                process.env.APP_SECRET,
                {
                  expiresIn: '6h',
                }
              )
              data[0].token = token
              response.status(201).send({ success: true, user: data[0] })
            }
          }
        } catch (error) {
          console.log(error)
          response
            .status(400)
            .send({ success: false, error: 'Sorry, an error occurred' })
        }
        break;

      default:
        console.error('[error][auth] unknown query parameter');
        response
          .status(400)
          .send({ success: false, error: 'Unknown query parameter' })
        break;
    }

  } catch (error) {
    console.log(error)
    response
      .status(400)
      .send({ success: false, error: 'Sorry, an error occurred' })
  }
}
