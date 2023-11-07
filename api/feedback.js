import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase credentials
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)



module.exports = async (req, res) => {

  switch (req.query.mode) {

    case 'view':
      // Define the view you want to query
      let viewName = 'feedback'
      viewName = process.env.NODE_ENV.startsWith('dev') ? viewName + '.dev' : viewName

      try {
        // Query the view to select everything
        const { data, error } = await supabase.from(viewName).select();
    
        if (error) {
          console.error('Error:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        } else {
          return res.status(200).json(data);
        }
      } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

    default:
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      const table = 'reasons'
      const storageName = process.env.NODE_ENV.startsWith('dev') ? table + '.dev' : table
      const { reasons, comment } = req.body;

      if (!reasons) {
        return res.status(400).json({ error: 'Missing data for request' });
      }

      let isErrorHappened = false

      try {
        for (const reason of reasons) {
          const { data, error } =
            await supabase.from(storageName).insert({
              reason_label: reason.label, reason_description: reason.description, comment: comment || null
            })
              .select()

          if (error) {
            console.error('Error inserting reason:', error);
            isErrorHappened = true
          }
          // else {
          //   console.log('Reason inserted:', data[0]);
          // }
        }

        if (!isErrorHappened) {
          return res.status(200).json({ message: 'Feedback submitted successfully' });
        } else {
          console.error(error);
          return res.status(500).json({ error: 'Failed to submit feedback' });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  }
};
