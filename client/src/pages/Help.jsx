import {
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Paper,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'

const Help = () => {
  const faqData = [
    {
      question: 'How do I register an account?',
      answer: 'Simply enter your desired username on the login page. The system will generate a unique session ID for you. Keep this ID safe as you\'ll need it to log back in.',
    },
    {
      question: 'How do I add friends?',
      answer: 'To add a friend, you\'ll need their session ID. Enter their session ID in the "Add Friend" field in the friends list sidebar.',
    },
    {
      question: 'How do I send messages?',
      answer: 'Select a friend from your friends list, type your message in the text field at the bottom of the chat window, and press Enter or click the send button.',
    },
    {
      question: 'How do I send attachments?',
      answer: 'Click the attachment icon (paper clip) in the chat window to select and send files. You can send images, documents, and other file types.',
    },
    {
      question: 'How do I record and send voice notes?',
      answer: 'Click the microphone icon in the chat window to start recording. Click it again to stop and send the voice note.',
    },
    {
      question: 'How do I update my profile?',
      answer: 'Go to the Profile page by clicking your avatar. There you can update your name, bio, status, and profile picture.',
    },
  ]

  const troubleshootingData = [
    {
      issue: 'Messages not sending',
      solution: 'Check your internet connection and refresh the page. If the problem persists, try logging out and back in.',
    },
    {
      issue: 'Can\'t upload files',
      solution: 'Make sure the file size is under the limit (10MB) and you have a stable internet connection.',
    },
    {
      issue: 'Voice notes not working',
      solution: 'Ensure you\'ve granted microphone permissions to the website in your browser settings.',
    },
  ]

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Help Center
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Frequently Asked Questions
          </Typography>
          {faqData.map((item, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{item.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom>
            Troubleshooting
          </Typography>
          {troubleshootingData.map((item, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{item.issue}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{item.solution}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Container>
  )
}

export default Help
