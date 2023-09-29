export default () => ({
  success: undefined,
  showNotification: false,
  status: '',
  details: '',
  async handleSubmit(event) {
    event.preventDefault()
    let data = {}
    for (var [key, value] of new FormData(event.target)) {
      data[key] = value
    }
    try {
      const response = await fetch(event.target.action, {
        method: this.$refs.supaform.method,
        body: JSON.stringify({table: this.$refs.supaform.name, data }),
        headers: {
          Accept: 'application/json',
        },
      })
      if (!response.ok) throw new Error({ response })
      this.success = true
      this.status = 'Succeeded'
      this.details = 'Thanks for your submission!'
      this.showNotification = true
      this.$refs.supaform.reset()
    } catch (e) {
        this.success = false
        this.status = 'Failed'
        this.details = 'There was a problem submitting your form.'
        this.showNotification = true
      // }
    }
  },
})
