import { useState, useEffect, useRef } from 'react'                  
import './App.css'

import {
  academicPressureQuestions,
  academicPressureCategories,
  academicPressureOptions,
} from './data/academicPressure'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const navigationLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Assessments', href: '#assessments' },
  { label: 'Reflect', href: '#reflect' },
  { label: 'Learn', href: '#learn', page: 'learn' },
]

const moods = [
  { name: 'happy', image: '/happy.png', label: 'Happy' },
  { name: 'neutral', image: '/neutral.png', label: 'Okay' },
  { name: 'sad', image: '/sad.png', label: 'Low' },
]

const features = [
  {
    number: '01',
    title: 'Understand yourself',
    description:
      'Explore short self-reflection assessments and learn more about your feelings.',
    id: 'assessments',
  },
  {
    number: '02',
    title: 'Check in with yourself',
    description:
      'Make space for your emotions and notice how you feel over time.',
    id: 'reflect',
  },
  {
    number: '03',
    title: 'Learn and grow',
    description:
      'Find practical ideas for taking care of your well-being.',
    id: 'learn',
  },
]

function App() {
  const [selectedMood, setSelectedMood] = useState(null)
  const [reflection, setReflection] = useState('')
  const [reflectionEntries, setReflectionEntries] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [learnCategory, setLearnCategory] = useState(null)
  const sessionIdRef = useRef(crypto.randomUUID())
  const submittedRef = useRef(false)
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')

  function startAssessment() {
    setCurrentQuestion(0)
    setAnswers({})
    sessionIdRef.current = crypto.randomUUID()
    submittedRef.current = false
    setSubmitStatus('idle')
    setSubmitError('')
    setCurrentPage('assessment')
  }

  function openAssessmentLibrary() {
    setCurrentPage('library')
  }

  function selectAnswer(value) {
    const question = academicPressureQuestions[currentQuestion]

    setAnswers((previous) => ({
      ...previous,
      [question.id]: value,
    }))
  }

  function nextQuestion() {
    if (currentQuestion < academicPressureQuestions.length - 1) {
      setCurrentQuestion((previous) => previous + 1)
    } else {
      setCurrentPage('results')
    }
  }

  function calculateResults() {
    const results = {}

    for (const question of academicPressureQuestions) {
      if (!results[question.category]) {
        results[question.category] = []
      }

      const answer = answers[question.id]

      if (typeof answer === 'number') {
        results[question.category].push(answer)
      }
    }

    return Object.entries(results).map(([category, scores]) => ({
      category,
      title: academicPressureCategories[category],
      average:
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : null,
      answered: scores.length,

    }))
  }

  function handleMoodSelect(mood) {
    setSelectedMood(mood)
    setSubmitted(false)
  }


  function handleReflectionSubmit(event) {
    event.preventDefault()

    if (!selectedMood) return

    if (reflection.trim()) {
      setReflectionEntries((previous) => [
        {
          id: Date.now(),
          mood: selectedMood,
          text: reflection.trim(),
          date: new Date().toLocaleDateString(),
        },
        ...previous,
      ])
    }

    setSubmitted(true)
  }

    async function submitResults() {

    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitStatus('sending')
    setSubmitError('')

    const payload = {
      session_id: sessionIdRef.current,
      answers,
      category_scores: calculateResults().map(({ category, average }) => ({
        category,
        score: average,
      })),
    }

    try {
      const response = await fetch(`${API_URL}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      setSubmitStatus('success')
    } catch (error) {
      console.error('Failed to submit the results:', error)
      submittedRef.current = false
      setSubmitError(error.message)
      setSubmitStatus('error')
    }
  }

  useEffect(() => {

    if (currentPage === 'results') submitResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  if (currentPage === 'profile') {
    return (
      <main className="app assessment-page profile-page">
        <button
          className="text-button"
          onClick={() => setCurrentPage('home')}
        >
          ← Back to home
        </button>

        <section className="profile-header">
          <img
            className="profile-portrait"
            src="/ferret.png"
            alt="Ferret profile"
          />

          <div className="profile-intro">
            <p className="eyebrow">YOUR PERSONAL SPACE</p>
            <h1>Profile</h1>
            <p>
              A little space to look back on your feelings
              and understand yourself.
            </p>
          </div>
        </section>

        <section className="history-section">
          <p className="eyebrow">YOUR JOURNEY</p>
          <h2>Reflection history</h2>
          <p className="history-description">
            Your previous check-ins, all in one place.
          </p>

          {reflectionEntries.length === 0 ? (
            <div className="history-empty">
              <span>🌱</span>
              <h3>Your story starts here</h3>
              <p>
                Your reflections will appear here after
                you complete a check-in on the home page.
              </p>
              <button
                className="primary-button"
                onClick={() => setCurrentPage('home')}
              >
                Write your first reflection →
              </button>
            </div>
          ) : (
            <div className="history-list">
              {reflectionEntries.map((entry) => (
                <article className="history-entry" key={entry.id}>
                  <div className="history-entry-top">
                    <strong>
                      {entry.mood === 'happy'
                        ? 'Happy'
                        : entry.mood === 'neutral'
                          ? 'Okay'
                          : 'Feeling low'}
                    </strong>
                    <time>{entry.date}</time>
                  </div>
                  <p>{entry.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    )
  }


  if (currentPage === 'learn') {
    return (
      <main className="app assessment-page">
        <button
          className="text-button"
          onClick={() => setCurrentPage('home')}
        >
          ← Back to home
        </button>

        <section className="library-header" id="learn">
          <p className="eyebrow">FERRET AID LEARN</p>
          <h1>Learn and grow</h1>
          <p>
            Explore research-informed resources and practical ways
            to take care of your well-being.
          </p>
        </section>

        <section className="assessment-library">
          <article className="assessment-tile">
            <span className="assessment-icon">📚</span>
            <h2>Academic pressure</h2>
            <p>
              Explore study stress, expectations, and fear of failure.
            </p>
            <a
              className="primary-button"
              href="https://www.nhs.uk/mental-health/children-and-young-adults/help-for-teenagers-young-adults-and-students/student-stress-self-help-tips/"
              target="_blank"
              rel="noreferrer"
            >
              Explore resources →
            </a>
          </article>

          <article className="assessment-tile">
            <span className="assessment-icon">💗</span>
            <h2>Family & relationships</h2>
            <p>
              Explore communication, boundaries, and difficult conversations.
            </p>
            <a
              className="primary-button"
              href="https://www.cdc.gov/parenting-teens/"
              target="_blank"
              rel="noreferrer"
            >
              Explore resources →
            </a>
          </article>

          <article className="assessment-tile">
            <span className="assessment-icon">🌿</span>
            <h2>Anxiety & emotional regulation</h2>
            <p>
              Learn practical skills for managing stress and difficult moments.
            </p>
            <a
              className="primary-button"
              href="https://www.who.int/publications/i/item/9789240003927"
              target="_blank"
              rel="noreferrer"
            >
              Explore resources →
            </a>
          </article>

          <article className="assessment-tile">
            <span className="assessment-icon">🌙</span>
            <h2>Sleep & recovery</h2>
            <p>
              Learn about sleep routines, rest, and recovery.
            </p>
            <a
              className="primary-button"
              href="https://www.nhs.uk/live-well/sleep-and-tiredness/"
              target="_blank"
              rel="noreferrer"
            >
              Explore resources →
            </a>
          </article>
        </section>
      </main>
    )
  }

  if (currentPage === 'library') {
    const assessments = [
      {
        id: 'academic-pressure',
        title: 'Academic Pressure',
        description: 'Explore how schoolwork, expectations, and future plans affect you.',
        duration: '3–5 min',
        available: true,
        icon: '📚',
      },
      {
        id: 'self-esteem',
        title: 'Self-Esteem',
        description: 'Explore how you view yourself and evaluate your own worth.',
        duration: 'Coming soon',
        available: false,
        icon: '💗',
      },
      {
        id: 'boundaries',
        title: 'Personal Boundaries',
        description: 'Reflect on saying no, expressing needs, and communicating limits.',
        duration: 'Coming soon',
        available: false,
        icon: '🛡️',
      },
      {
        id: 'procrastination',
        title: 'Procrastination',
        description: 'Explore patterns that make it difficult to start or finish tasks.',
        duration: 'Coming soon',
        available: false,
        icon: '⏳',
      },
    ]

    return (
      <main className="app assessment-page">
        <button
          className="text-button"
          onClick={() => setCurrentPage('home')}
        >
          ← Back to home
        </button>

        <section className="library-header">
          <p className="eyebrow">YOUR SELF-DISCOVERY SPACE</p>
          <h1>Explore yourself</h1>
          <p>
            Choose a topic you would like to understand better.
            Take your time — there are no right or wrong answers.
          </p>
        </section>

        <section className="assessment-library">
          {assessments.map((assessment) => (
            <article className="assessment-tile" key={assessment.id}>
              <span className="assessment-icon">{assessment.icon}</span>
              <h2>{assessment.title}</h2>
              <p>{assessment.description}</p>
              <span className="assessment-duration">
                {assessment.duration}
              </span>

              <button
                className={
                  assessment.available
                    ? 'primary-button'
                    : 'secondary-button'
                }
                disabled={!assessment.available}
                onClick={() => {
                  if (assessment.id === 'academic-pressure') {
                    startAssessment()
                  }
                }}
              >
                {assessment.available ? 'Start assessment →' : 'Coming soon'}
              </button>
            </article>
          ))}
        </section>
      </main>
    )
  }

  if (currentPage === 'assessment') {
    const question = academicPressureQuestions[currentQuestion]
    const selectedAnswer = answers[question.id]

    return (
      <main className="app assessment-page">
        <button
          className="text-button"
          onClick={() => setCurrentPage('home')}
        >
          ← Back to home
        </button>

        <section className="assessment-card">
          <p className="eyebrow">FERRET AID ASSESSMENTS</p>

          <h1>Academic Pressure</h1>

          <p>
            Question {currentQuestion + 1} of{' '}
            {academicPressureQuestions.length}
          </p>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${((currentQuestion + 1) /
                  academicPressureQuestions.length) *
                  100
                  }%`,
              }}
            />
          </div>

          <h2>{question.text}</h2>

          <p>Think about the past two weeks.</p>

          <div className="answer-options">
            {academicPressureOptions.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className={`answer-option ${selectedAnswer === option.value ? 'selected' : ''
                  }`}
                onClick={() => selectAnswer(option.value)}
                aria-pressed={selectedAnswer === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            className="primary-button"
            disabled={selectedAnswer === undefined}
            onClick={nextQuestion}
          >
            {currentQuestion === academicPressureQuestions.length - 1
              ? 'View results →'
              : 'Next question →'}
          </button>
        </section>
      </main>
    )
  }



  if (currentPage === 'results') {
    const results = calculateResults()

    return (
      <main className="app assessment-page">
        <section className="assessment-card">
          <p className="eyebrow">YOUR REFLECTION</p>
          <h1>Your Academic Pressure Results</h1>

          <p>
            These scores summarize your answers. They are not a diagnosis
            or a validated measure of stress severity.
          </p>

          {results.map((result) => (
            <article className="result-card" key={result.category}>
              <h2>{result.title}</h2>

              {result.average === null ? (
                <p>Not enough answers to calculate this result.</p>
              ) : (
                <>
                  <p>Average response: {result.average.toFixed(1)} / 4</p>
                  <p>{result.answered} of 3 questions answered</p>
                </>
              )}
            </article>
          ))}

          {submitStatus === 'error' && (
            <div>
              <p>could not save your results. Try again: {submitError}</p>
              <button
                className="text-button"
                type="button"
                onClick={submitResults}
              >
                retry
              </button>
            </div>
          )}

          <button
            className="primary-button"
            onClick={() => setCurrentPage('home')}
          >
            Back to home
          </button>

          <button className="text-button" onClick={startAssessment}>
            Retake assessment
          </button>

          <button
            className="primary-button"
            onClick={() => setCurrentPage('learn')}
          >
            Learn more →
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app" id="home">
      <header className="site-header">
        <a className="brand" href="#home">
          Ferret Aid
          <span className="brand-tagline">a little space for you</span>
        </a>

        <nav className="navigation" aria-label="Main navigation">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => {
                if (link.page) {
                  event.preventDefault()
                  setCurrentPage(link.page)
                }
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          className="profile-link"
          href="#profile"
          onClick={(event) => {
            event.preventDefault()
            setCurrentPage('profile')
          }}
        >
          <img
            className="ferret-avatar"
            src="/ferret.png"
            alt="Ferret profile"
          />
          <span>profile →</span>
        </a>
      </header>

      <section className="mood-section">
        <img
          className="mascot"
          src="/ferret-mascot.png"
          alt="Your little Ferret Aid companion"
        />

        <p className="eyebrow">YOUR SPACE TO PAUSE AND REFLECT</p>

        <h1>How are you feeling today?</h1>

        <p className="section-description">
          Choose the little mood that feels closest to yours.
        </p>


        <div className="mood-options">
          {moods.map((mood) => (
            <button
              className={`mood-option ${selectedMood === mood.name ? 'selected' : ''
                }`}
              key={mood.name}
              type="button"
              onClick={() => handleMoodSelect(mood.name)}
              aria-pressed={selectedMood === mood.name}
            >
              <img
                className={`mood-face mood-${mood.name}`}
                src={mood.image}
                alt={mood.label}
              />
              <span>{mood.label}</span>
            </button>
          ))}
        </div>


        {selectedMood && (
          <form
            className="reflection-card"
            onSubmit={handleReflectionSubmit}
          >
            {submitted ? (
              <div className="reflection-success">
                <h2>Thank you for checking in 💗</h2>
                <p>
                  Taking a moment to notice your feelings is
                  already a meaningful step.
                </p>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setSelectedMood(null)
                    setReflection('')
                    setSubmitted(false)
                  }}
                >
                  Check in again
                </button>
              </div>
            ) : (
              <>
                <h2>Why do you feel this way?</h2>
                <p>
                  You can share a little about what is on your
                  mind. There is no right or wrong answer.
                </p>

                <label className="visually-hidden" htmlFor="reflection">
                  Why do you feel this way?
                </label>

                <textarea
                  id="reflection"
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="I feel this way because..."
                  rows={3}
                />

                <button className="primary-button" type="submit">
                  Continue →
                </button>
              </>
            )}
          </form>
        )}

        <a className="scroll-hint" href="#about">
          ↓ &nbsp; Scroll down to learn more about Ferret Aid
        </a>
      </section>

      <section className="about-section" id="about">
        <p className="eyebrow">A GENTLE WAY TO TAKE CARE OF YOURSELF</p>
        <h2>Small steps. Big changes.</h2>
        <p className="about-description">
          Ferret Aid helps you understand your feelings,
          reflect on what you need, and build healthier habits
          — at your own pace.
        </p>

        <div className="features">
          {features.map((feature) => (
            <article
              className="feature-card"
              id={feature.id}
              key={feature.number}
            >
              <span className="card-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>

              {feature.id === 'assessments' && (
                <button
                  className="primary-button"
                  onClick={openAssessmentLibrary}
                >
                  Take assessment →
                </button>
              )}

              {feature.id === 'learn' && (
                <button
                  className="primary-button"
                  onClick={() => setCurrentPage('learn')}
                >
                  Explore resources →
                </button>
              )}

            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        Ferret Aid · A gentle space for self-reflection
      </footer>
    </main>
  )
}

export default App
