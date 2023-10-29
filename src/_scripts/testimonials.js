export default () => ({
  // isFetching: false,
  // showInput: false,
  // status: '',
  // details: '',
  // success: false,
  // showNotification: false,
  identity: '',
  description: '',
  showInput: false,
  isFetching: false,
  items: [],
  saveTestimonial(evt) {
    this.isFetching = true

    const file = evt.target[2].files[0]
    const data = new FormData()
    data.append('description', this.description)
    data.append('identity', this.identity)
    data.append('picture', file)

    fetch('/api/testimonials-add', {
      method: 'POST',
      body: data,
    })
      .then((response) => response.json())
      .then(async (message) => {
        if (message.success) {
          this.showInput = false
          this.isFetching = false
          this.$refs.testimonialform.reset()
          this.status = 'Succeeded'
          this.details = 'Your testimonial was correctly added!'
          this.success = true
          this.showNotification = true
          this.registerEvent('testimonial', 'click')
          this.items = (
            await (await fetch('/api/testimonials-select')).json()
          ).data

        } else {
          throw new Error()
          // this.showInput = false
          // this.isFetching = false
          // this.status = message.error.details
          // this.details = message.error.message
          // this.success = false
          // this.showNotification = true
        }
      })
      .catch((error) => {
        // console.error(error)
        this.isFetching = false
        this.status = 'Failed to add testimonial'
        this.details = 'There might be a problem with the database or the code on the server.'
        this.success = false
        this.showNotification = true
        // console.log(error)
      })
  },

  isFormatted(input) {
    // Use a regular expression to split the input into sentences based on punctuation marks.
    const sentences = input.split(/[.!?]/);

    // Filter out any empty strings.
    const nonEmptySentences = sentences.filter(sentence => sentence.trim() !== '');

    // Check if the number of sentences is 2 or 3.
    return nonEmptySentences.length === 2 || nonEmptySentences.length === 3;
  }


  // shuffle(array) {
  //   for (let i = array.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1))
  //     const temp = array[i]
  //     array[i] = array[j]
  //     array[j] = temp
  //   }
  // },
})
