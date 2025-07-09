import { ref } from 'vue'
import { getAuth } from 'firebase/auth'

export function useGoogleForms() {
  // State
  const isInitialized = ref(false)
  const accessToken = ref('')
  const formsStatus = ref('idle') // idle, loading, success, error
  const formsMessage = ref('')
  const linkedForms = ref([])

  // Constants
  const FORMS_STORAGE_KEY = 'casemanage_teacher_feedback_forms'
  const REQUIRED_SCOPES = [
    'https://www.googleapis.com/auth/forms',
    'https://www.googleapis.com/auth/forms.responses.readonly',
    'https://www.googleapis.com/auth/drive.file'
  ]

  // Initialize Google Forms API
  const initializeGoogleAuth = () => {
    return new Promise((resolve, reject) => {
      if (typeof window.gapi === 'undefined') {
        console.error('Google API not loaded')
        reject(new Error('Google API not loaded'))
        return
      }

      window.gapi.load('auth2:client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            discoveryDocs: [
              'https://forms.googleapis.com/$discovery/rest?version=v1',
              'https://sheets.googleapis.com/$discovery/rest?version=v4'
            ],
            scope: REQUIRED_SCOPES.join(' ')
          })

          isInitialized.value = true
          console.log('🔍 Google Forms API initialized')
          resolve()
        } catch (error) {
          console.error('Failed to initialize Google Forms API:', error)
          reject(error)
        }
      })
    })
  }

  // Request access token
  const requestAccessToken = async () => {
    try {
      formsStatus.value = 'loading'
      formsMessage.value = 'Requesting Google authorization...'

      const authInstance = window.gapi.auth2.getAuthInstance()
      const user = await authInstance.signIn({
        scope: REQUIRED_SCOPES.join(' ')
      })

      const authResponse = user.getAuthResponse()
      accessToken.value = authResponse.access_token

      console.log('🔍 Google Forms access token obtained')
      formsStatus.value = 'success'
      formsMessage.value = 'Authorization successful'
      
      return authResponse.access_token
    } catch (error) {
      console.error('Failed to get access token:', error)
      formsStatus.value = 'error'
      formsMessage.value = 'Authorization failed'
      throw error
    }
  }

  // Form templates
  const getFormTemplates = () => {
    return {
      academic: {
        name: "Academic Performance Feedback",
        description: "Gather feedback on student's academic performance and progress",
        questions: [
          {
            title: "How is this student performing academically in your class?",
            type: "RADIO",
            required: true,
            options: [
              { value: "Exceeding expectations" },
              { value: "Meeting expectations" },
              { value: "Approaching expectations" },
              { value: "Below expectations" }
            ]
          },
          {
            title: "What specific academic strengths have you observed?",
            type: "PARAGRAPH_TEXT",
            required: false
          },
          {
            title: "What academic areas need improvement?",
            type: "PARAGRAPH_TEXT",
            required: false
          },
          {
            title: "Rate the student's participation in class:",
            type: "RADIO",
            required: true,
            options: [
              { value: "Excellent - Actively participates" },
              { value: "Good - Participates when prompted" },
              { value: "Fair - Limited participation" },
              { value: "Poor - Rarely participates" }
            ]
          }
        ]
      },
      behavior: {
        name: "Behavior & Social Skills Feedback",
        description: "Assess student's behavior and social interactions in the classroom",
        questions: [
          {
            title: "How would you rate this student's behavior in class?",
            type: "RADIO",
            required: true,
            options: [
              { value: "Excellent" },
              { value: "Good" },
              { value: "Fair" },
              { value: "Needs improvement" }
            ]
          },
          {
            title: "Describe any behavioral concerns or successes:",
            type: "PARAGRAPH_TEXT",
            required: false
          },
          {
            title: "How well does the student follow classroom rules and procedures?",
            type: "RADIO",
            required: true,
            options: [
              { value: "Always follows rules" },
              { value: "Usually follows rules" },
              { value: "Sometimes follows rules" },
              { value: "Rarely follows rules" }
            ]
          },
          {
            title: "Rate the student's social interactions with peers:",
            type: "RADIO",
            required: true,
            options: [
              { value: "Positive interactions" },
              { value: "Generally positive" },
              { value: "Mixed interactions" },
              { value: "Challenging interactions" }
            ]
          }
        ]
      },
      accommodations: {
        name: "Accommodations Effectiveness",
        description: "Evaluate the effectiveness of current accommodations and suggest improvements",
        questions: [
          {
            title: "Are the current accommodations effective for this student?",
            type: "RADIO",
            required: true,
            options: [
              { value: "Very effective" },
              { value: "Somewhat effective" },
              { value: "Not effective" },
              { value: "Need different accommodations" }
            ]
          },
          {
            title: "Which accommodations work best for this student?",
            type: "PARAGRAPH_TEXT",
            required: false
          },
          {
            title: "What additional accommodations would you recommend?",
            type: "PARAGRAPH_TEXT",
            required: false
          },
          {
            title: "How often do you implement the accommodations?",
            type: "RADIO",
            required: true,
            options: [
              { value: "Always" },
              { value: "Most of the time" },
              { value: "Sometimes" },
              { value: "Rarely" }
            ]
          }
        ]
      }
    }
  }

  // Create a feedback form
  const createFeedbackForm = async (student, teachers, templateKeys, excludedPeriods = []) => {
    if (!accessToken.value) {
      await requestAccessToken()
    }

    try {
      formsStatus.value = 'loading'
      formsMessage.value = 'Creating feedback form...'

      const templates = getFormTemplates()
      const selectedTemplates = templateKeys.map(key => templates[key]).filter(Boolean)
      
      if (selectedTemplates.length === 0) {
        throw new Error('No valid templates selected')
      }

      // Create the form
      const formTitle = `Teacher Feedback - ${student.firstName} ${student.lastName} (Grade ${student.grade})`
      const formDescription = `Please provide feedback for ${student.firstName} ${student.lastName}. This information will be used for IEP planning and academic support.`

      const createResponse = await window.gapi.client.forms.forms.create({
        resource: {
          info: {
            title: formTitle,
            description: formDescription
          }
        }
      })

      const formId = createResponse.result.formId
      const formUrl = `https://docs.google.com/forms/d/${formId}/edit`

      console.log('🔍 Created form:', formId)

      // Prepare all questions from selected templates
      const allQuestions = []
      
      // Add student info section
      allQuestions.push({
        createItem: {
          item: {
            title: "Teacher Information",
            description: "Please provide your information",
            questionItem: {
              question: {
                required: true,
                textQuestion: {
                  paragraph: false
                }
              }
            }
          },
          location: { index: 0 }
        }
      })

      // Add period/subject question
      allQuestions.push({
        createItem: {
          item: {
            title: "What period/subject do you teach this student?",
            questionItem: {
              question: {
                required: true,
                textQuestion: {
                  paragraph: false
                }
              }
            }
          },
          location: { index: 1 }
        }
      })

      // Add questions from templates
      let questionIndex = 2
      selectedTemplates.forEach(template => {
        // Add template header
        allQuestions.push({
          createItem: {
            item: {
              title: template.name,
              description: template.description,
              textItem: {}
            },
            location: { index: questionIndex++ }
          }
        })

        // Add template questions
        template.questions.forEach(question => {
          const questionItem = {
            createItem: {
              item: {
                title: question.title,
                questionItem: {
                  question: {
                    required: question.required
                  }
                }
              },
              location: { index: questionIndex++ }
            }
          }

          // Set question type
          if (question.type === 'RADIO') {
            questionItem.createItem.item.questionItem.question.choiceQuestion = {
              type: 'RADIO',
              options: question.options
            }
          } else if (question.type === 'PARAGRAPH_TEXT') {
            questionItem.createItem.item.questionItem.question.textQuestion = {
              paragraph: true
            }
          }

          allQuestions.push(questionItem)
        })
      })

      // Add all questions to the form
      await window.gapi.client.forms.forms.batchUpdate({
        formId: formId,
        resource: {
          requests: allQuestions
        }
      })

      // Create linked response sheet
      const sheetResponse = await window.gapi.client.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: `${formTitle} - Responses`
          }
        }
      })

      const sheetId = sheetResponse.result.spreadsheetId
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`

      // Link form to response sheet
      await window.gapi.client.forms.forms.batchUpdate({
        formId: formId,
        resource: {
          requests: [{
            updateSettings: {
              settings: {
                quizSettings: {
                  isQuiz: false
                }
              },
              updateMask: 'quizSettings'
            }
          }]
        }
      })

      const formData = {
        id: formId,
        title: formTitle,
        url: formUrl,
        editUrl: formUrl,
        responseUrl: `https://docs.google.com/forms/d/${formId}/viewform`,
        sheetId: sheetId,
        sheetUrl: sheetUrl,
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          grade: student.grade
        },
        teachers: teachers,
        templates: templateKeys,
        excludedPeriods: excludedPeriods,
        createdAt: new Date().toISOString(),
        responseCount: 0
      }

      // Store form info
      const existingForms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]')
      existingForms.push(formData)
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(existingForms))
      linkedForms.value = existingForms

      formsStatus.value = 'success'
      formsMessage.value = 'Feedback form created successfully!'

      console.log('🔍 Form created successfully:', formData)
      return formData

    } catch (error) {
      console.error('Error creating feedback form:', error)
      formsStatus.value = 'error'
      formsMessage.value = `Failed to create form: ${error.message}`
      throw error
    }
  }

  // Get form responses
  const getFormResponses = async (formId) => {
    if (!accessToken.value) {
      await requestAccessToken()
    }

    try {
      const response = await window.gapi.client.forms.forms.responses.list({
        formId: formId
      })

      return response.result.responses || []
    } catch (error) {
      console.error('Error fetching form responses:', error)
      throw error
    }
  }

  // Load existing forms from storage
  const loadExistingForms = () => {
    const stored = localStorage.getItem(FORMS_STORAGE_KEY)
    if (stored) {
      linkedForms.value = JSON.parse(stored)
    }
  }

  // Delete a form
  const deleteFeedbackForm = async (formId) => {
    try {
      // Note: Google Forms API doesn't support deleting forms
      // We can only remove from our local storage
      const existingForms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]')
      const updatedForms = existingForms.filter(form => form.id !== formId)
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updatedForms))
      linkedForms.value = updatedForms

      formsMessage.value = 'Form removed from list (Google Form still exists)'
      return true
    } catch (error) {
      console.error('Error removing form:', error)
      throw error
    }
  }

  return {
    // State
    isInitialized,
    accessToken,
    formsStatus,
    formsMessage,
    linkedForms,

    // Methods
    initializeGoogleAuth,
    requestAccessToken,
    createFeedbackForm,
    getFormResponses,
    loadExistingForms,
    deleteFeedbackForm,
    getFormTemplates
  }
} 