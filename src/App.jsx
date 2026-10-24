import { useState } from 'react'
import './App.css'

import {
  academicPressureQuestions,
  academicPressureCategories,
  academicPressureOptions,
} from './data/academicPressure'

const navigationLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Assessments', href: '#assessments' },
  { label: 'Reflect', href: '#reflect' },
  { label: 'Learn', href: '#learn' },
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
  const [submitted, setSubmitted] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  function startAssessment() {
    setCurrentQuestion(0)
    setAnswers({})
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

    setSubmitted(true)
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
                  <p>
                    Average response: {result.average.toFixed(1)} / 4
                  </p>
                  <p>
                    {result.answered} of 3 questions answered
                  </p>
                </>
              )}
            </article>
          ))}

          <button
            className="primary-button"
            onClick={() => setCurrentPage('home')}
          >
            Back to home
          </button>

          <button
            className="text-button"
            onClick={startAssessment}
          >
            Retake assessment
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
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <a className="profile-link" href="#profile">
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
