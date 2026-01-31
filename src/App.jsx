import { useState, useEffect } from 'react'
import { supabase, isDemoMode } from './supabaseClient'

// Family options for dropdown
const FAMILY_OPTIONS = [
  { value: '', label: 'Choose your name...' },
  { value: 'Ben & Mary & Fam', label: 'Ben & Mary & Fam' },
  { value: 'Tal & Doug & Fam', label: 'Tal & Doug & Fam' },
  { value: 'Joy & Plamen & Roman', label: 'Joy & Plamen & Roman' },
  { value: 'Valerie', label: 'Valerie' },
  { value: 'Ronit', label: 'Ronit' },
  { value: 'other', label: 'Someone else...' },
]

// Section definitions
const SECTIONS = [
  'overview',
  'thursday-arrival',
  'friday-arrival',
  'saturday-universal',
  'sunday-animal-kingdom',
  'monday-hollywood-studios',
  'lodging',
  'transportation',
  'food',
]

function App() {
  const [userName, setUserName] = useState('')
  const [selectedFamily, setSelectedFamily] = useState('')
  const [customName, setCustomName] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [feedback, setFeedback] = useState({})
  const [lodgingPref, setLodgingPref] = useState('')
  const [lodgingConstraints, setLodgingConstraints] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState('')
  const [dietaryPreferences, setDietaryPreferences] = useState('')
  const [privateFeedback, setPrivateFeedback] = useState({
    budget: '',
    pace: '',
    kids: '',
    other: '',
  })
  const [existingFeedback, setExistingFeedback] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load existing feedback on mount
  useEffect(() => {
    loadExistingFeedback()
  }, [])

  const loadExistingFeedback = async () => {
    if (isDemoMode) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('trip_feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingFeedback(data || [])
    } catch (err) {
      console.error('Error loading feedback:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStart = () => {
    const name = selectedFamily === 'other' ? customName : selectedFamily
    if (name.trim()) {
      setUserName(name.trim())
      setIsStarted(true)
    }
  }

  const handleFeedbackChange = (sectionId, field, value) => {
    setFeedback((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const submission = {
      person_name: userName,
      section_feedback: Object.entries(feedback).map(([sectionId, data]) => ({
        sectionId,
        sentiment: data.sentiment || null,
        comment: data.comment || null,
      })),
      lodging_preference: lodgingPref || null,
      lodging_constraints: lodgingConstraints || null,
      dietary_restrictions: dietaryRestrictions || null,
      dietary_preferences: dietaryPreferences || null,
      private_budget: privateFeedback.budget || null,
      private_pace: privateFeedback.pace || null,
      private_kids: privateFeedback.kids || null,
      private_other: privateFeedback.other || null,
    }

    if (isDemoMode) {
      console.log('Demo mode - would submit:', submission)
      await new Promise((r) => setTimeout(r, 1000))
      setIsSubmitted(true)
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.from('trip_feedback').insert([submission])
      if (error) throw error
      setIsSubmitted(true)
      loadExistingFeedback()
    } catch (err) {
      console.error('Error submitting:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setIsStarted(false)
    setIsSubmitted(false)
    setUserName('')
    setSelectedFamily('')
    setCustomName('')
    setFeedback({})
    setLodgingPref('')
    setLodgingConstraints('')
    setDietaryRestrictions('')
    setDietaryPreferences('')
    setPrivateFeedback({ budget: '', pace: '', kids: '', other: '' })
  }

  const getFeedbackForSection = (sectionId) => {
    return existingFeedback
      .filter((f) => {
        const sectionData = f.section_feedback?.find((s) => s.sectionId === sectionId)
        return sectionData && (sectionData.sentiment || sectionData.comment)
      })
      .map((f) => {
        const sectionData = f.section_feedback.find((s) => s.sectionId === sectionId)
        return {
          name: f.person_name,
          sentiment: sectionData.sentiment,
          comment: sectionData.comment,
        }
      })
  }

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="loading-spinner" />
          <p>Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="app-container">
        <Header />
        <div className="success-message">
          <div className="success-icon">🎉</div>
          <h2>Thanks, {userName}!</h2>
          <p>
            Your feedback has been saved. Doug will review everything and follow
            up if needed. Enjoy the anticipation!
          </p>
          <button onClick={handleReset}>Submit feedback as someone else</button>
        </div>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className="app-container">
        <Header />
        <div className="name-selector">
          <h2>👋 Who's checking in?</h2>
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
          >
            {FAMILY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {selectedFamily === 'other' && (
            <input
              type="text"
              placeholder="Enter your name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          )}

          <button
            className="btn-continue"
            onClick={handleStart}
            disabled={
              !selectedFamily ||
              (selectedFamily === 'other' && !customName.trim())
            }
          >
            Let's see the plan ✨
          </button>
        </div>

        {isDemoMode && (
          <div className="info-box">
            <p>
              <strong>Demo Mode:</strong> Supabase isn't configured yet. Feedback
              won't be saved, but you can explore the app.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app-container">
      <Header />

      <div className="welcome-back">
        <p>👋 Viewing as: {userName}</p>
        <button onClick={handleReset}>Switch person</button>
      </div>

      {/* Trip Overview */}
      <SectionCard
        id="overview"
        icon="🗺️"
        title="The Big Picture"
      >
        <div className="section-content">
          <p>
            Here's the plan as it stands. <strong>Nothing is locked.</strong> This
            is a roadmap, not a minute-by-minute schedule. The goal is alignment,
            not perfection.
          </p>
          <p>
            Read through each section. Where you have thoughts, questions, or
            concerns—flag them. I'll review everything and we'll sort it out
            together.
          </p>
          <div className="info-box tip">
            <p>
              <strong>Expect flexibility:</strong> With 8 adults, 5 kids (ages 1–11),
              and three parks, we'll naturally split into groups based on energy,
              interests, and ride heights. That's not just okay—it's the plan.
            </p>
          </div>
        </div>
        <FeedbackWidget
          sectionId="overview"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('overview')}
        />
      </SectionCard>

      {/* Thursday Arrival */}
      <SectionCard
        id="thursday-arrival"
        icon="✈️"
        title="Thursday Night Arrival"
        date="February 19"
      >
        <div className="section-content">
          <p>
            Ben, Mary, and Ronit arrive in Orlando Thursday night. Early start on
            the Florida time zone.
          </p>
          <div className="attendance">
            <span className="attendance-chip">Ben & Mary & Fam</span>
            <span className="attendance-chip">Ronit</span>
          </div>
          <p>
            No parks this day—just arrival and settling in.
          </p>
        </div>
        <FeedbackWidget
          sectionId="thursday-arrival"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('thursday-arrival')}
        />
      </SectionCard>

      {/* Friday Arrival */}
      <SectionCard
        id="friday-arrival"
        icon="🌴"
        title="Friday Night Arrival"
        date="February 20"
      >
        <div className="section-content">
          <p>Everyone else lands Friday evening. No parks—just arrival and regrouping.</p>
          <div className="attendance">
            <span className="attendance-chip">Tal & Doug & Fam</span>
            <span className="attendance-chip">Joy & Plamen & Roman</span>
            <span className="attendance-chip">Valerie</span>
          </div>
          <p>
            We'll stay at a hotel near Universal Friday night (details in Lodging
            section), then move to the Airbnb Saturday.
          </p>
        </div>
        <FeedbackWidget
          sectionId="friday-arrival"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('friday-arrival')}
        />
      </SectionCard>

      {/* Saturday - Universal */}
      <SectionCard
        id="saturday-universal"
        icon="🎢"
        title="Saturday: Universal Studios"
        date="February 21"
        className="park-day universal"
      >
        <div className="section-content">
          <p>
            <strong>Both Universal parks</strong>—Studios and Islands of Adventure.
            This is the big thrill day for those who want it.
          </p>
          <div className="attendance">
            <span className="attendance-chip">Everyone</span>
          </div>
          <p>
            <strong>What to expect:</strong>
          </p>
          <ul>
            <li>Big rides for those who want them (Velocicoaster, Hagrid's, etc.)</li>
            <li>Family-pace groups for the younger kids</li>
            <li>Regular meetup points throughout the day</li>
            <li>Splitting up is expected and encouraged</li>
          </ul>
          <div className="info-box">
            <p>
              Strollers will be needed for Liam (1) and Roman (2). We'll figure out
              rental vs. bringing our own.
            </p>
          </div>
        </div>
        <FeedbackWidget
          sectionId="saturday-universal"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('saturday-universal')}
        />
      </SectionCard>

      {/* Sunday - Animal Kingdom */}
      <SectionCard
        id="sunday-animal-kingdom"
        icon="🦁"
        title="Sunday: Animal Kingdom"
        date="February 22"
        className="park-day animal-kingdom"
      >
        <div className="section-content">
          <p>
            A slightly gentler pace. Great for the little ones, with some solid
            rides for everyone else.
          </p>
          <div className="attendance">
            <span className="attendance-chip">Everyone (morning)</span>
            <span className="attendance-chip note">
              Joy, Plamen & Roman leave mid-afternoon
            </span>
          </div>
          <p>
            <strong>Highlights:</strong>
          </p>
          <ul>
            <li>Kilimanjaro Safaris (best done early)</li>
            <li>Avatar Flight of Passage for thrill-seekers</li>
            <li>Lots of animal exhibits and shows for the kids</li>
            <li>More flexible groupings—some may want to linger, some may want to ride</li>
          </ul>
          <div className="info-box">
            <p>
              Joy, Plamen, and Roman will head back to Spring Hill mid-afternoon.
              We'll plan a good handoff point.
            </p>
          </div>
        </div>
        <FeedbackWidget
          sectionId="sunday-animal-kingdom"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('sunday-animal-kingdom')}
        />
      </SectionCard>

      {/* Monday - Hollywood Studios */}
      <SectionCard
        id="monday-hollywood-studios"
        icon="🚀"
        title="Monday: Hollywood Studios → Home"
        date="February 23"
        className="park-day hollywood-studios"
      >
        <div className="section-content">
          <p>
            Final park day, then Tal and Doug's crew drives back to Spring Hill.
          </p>
          <div className="attendance">
            <span className="attendance-chip">Tal & Doug & Fam</span>
            <span className="attendance-chip">Ben & Mary & Fam</span>
            <span className="attendance-chip">Valerie</span>
            <span className="attendance-chip">Ronit</span>
          </div>
          <p>
            <strong>The main event:</strong>
          </p>
          <ul>
            <li>Galaxy's Edge (Star Wars land) is the centerpiece</li>
            <li>Tower of Terror, Rock 'n' Roller Coaster for thrill folks</li>
            <li>Toy Story Land for the kids</li>
            <li>We'll plan departure timing based on energy and traffic</li>
          </ul>
          <div className="info-box">
            <p>
              Tal & Doug will drive the kids back to Spring Hill Monday evening.
              Others may have different departure plans.
            </p>
          </div>
        </div>
        <FeedbackWidget
          sectionId="monday-hollywood-studios"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('monday-hollywood-studios')}
        />
      </SectionCard>

      {/* Lodging */}
      <SectionCard id="lodging" icon="🏠" title="Where We're Staying">
        <div className="section-content">
          <p>
            <strong>Friday night (Feb 20):</strong> Hotel near Universal. Everyone
            arriving Friday stays here.
          </p>
          <p>
            <strong>Saturday & Sunday nights (Feb 21–22):</strong> Large Airbnb near
            Disney. Cost split evenly among families.
          </p>
          <div className="info-box">
            <p>
              Some families may prefer a nearby hotel room instead of sharing the
              house. That's completely fine—just let me know your preference below.
            </p>
          </div>
          <p>
            <strong>What's not happening:</strong> No Tampa airport hotel. We're
            keeping it simple.
          </p>
        </div>

        <div className="special-input">
          <label>What's your preference for Saturday/Sunday nights?</label>
          <select
            value={lodgingPref}
            onChange={(e) => setLodgingPref(e.target.value)}
          >
            <option value="">Select your preference...</option>
            <option value="house">Stay at the shared house</option>
            <option value="nearby-hotel">Prefer a nearby hotel</option>
            <option value="no-preference">No strong preference</option>
          </select>
        </div>

        <div className="special-input">
          <label>Any constraints we should know about? (sleep needs, space, cost sensitivity)</label>
          <textarea
            placeholder="Optional—anything that would affect lodging decisions"
            value={lodgingConstraints}
            onChange={(e) => setLodgingConstraints(e.target.value)}
          />
        </div>

        <FeedbackWidget
          sectionId="lodging"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('lodging')}
        />
      </SectionCard>

      {/* Transportation */}
      <SectionCard id="transportation" icon="🚗" title="Getting Around">
        <div className="section-content">
          <p>
            <strong>The plan:</strong> Uber/Lyft to and from the parks each day.
          </p>
          <p>
            No parking logistics to coordinate, no designated drivers, no one stuck
            waiting for everyone else. We'll travel in smaller groups as it makes
            sense—flexibility is the priority.
          </p>
          <div className="info-box tip">
            <p>
              This keeps things simple. No one is responsible for driving the whole
              crew, and people can leave when they need to.
            </p>
          </div>
        </div>
        <FeedbackWidget
          sectionId="transportation"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('transportation')}
          promptText="Any issues with this approach?"
        />
      </SectionCard>

      {/* Food */}
      <SectionCard id="food" icon="🍳" title="Food Plan">
        <div className="section-content">
          <p>
            <strong>The approach:</strong>
          </p>
          <ul>
            <li>One grocery run early in the trip</li>
            <li>Breakfast and snacks at the house each morning</li>
            <li>Pack at least one meal per park day (saves money and time)</li>
            <li>Mostly quick-service food at the parks when we buy there</li>
          </ul>
          <p>
            No fancy sit-down reservations unless someone really wants to coordinate
            one. The goal is low-friction fuel, not dining experiences.
          </p>
        </div>

        <div className="special-input">
          <label>Any dietary restrictions?</label>
          <textarea
            placeholder="Allergies, vegetarian, kosher, etc."
            value={dietaryRestrictions}
            onChange={(e) => setDietaryRestrictions(e.target.value)}
          />
        </div>

        <div className="special-input">
          <label>Any preferences worth knowing? (not demands, just helpful info)</label>
          <textarea
            placeholder="Picky eaters, favorite snacks, things to avoid..."
            value={dietaryPreferences}
            onChange={(e) => setDietaryPreferences(e.target.value)}
          />
        </div>

        <FeedbackWidget
          sectionId="food"
          feedback={feedback}
          onChange={handleFeedbackChange}
          existingFeedback={getFeedbackForSection('food')}
        />
      </SectionCard>

      {/* Private Feedback */}
      <div className="section-card private-feedback">
        <div className="section-header">
          <span className="section-icon">🔒</span>
          <div className="section-title-group">
            <h3 className="section-title">Private Feedback</h3>
          </div>
        </div>

        <div className="privacy-note">
          This section is just between you and Doug. Use it for anything you'd
          rather not share with the whole group.
        </div>

        <div className="form-group">
          <label>Budget sensitivity</label>
          <textarea
            placeholder="Anything about costs we should know?"
            value={privateFeedback.budget}
            onChange={(e) =>
              setPrivateFeedback((prev) => ({ ...prev, budget: e.target.value }))
            }
          />
        </div>

        <div className="form-group">
          <label>Energy / pace concerns</label>
          <textarea
            placeholder="Worried about keeping up? Need more downtime?"
            value={privateFeedback.pace}
            onChange={(e) =>
              setPrivateFeedback((prev) => ({ ...prev, pace: e.target.value }))
            }
          />
        </div>

        <div className="form-group">
          <label>Kid-specific constraints</label>
          <textarea
            placeholder="Nap schedules, sensory issues, fears, needs..."
            value={privateFeedback.kids}
            onChange={(e) =>
              setPrivateFeedback((prev) => ({ ...prev, kids: e.target.value }))
            }
          />
        </div>

        <div className="form-group">
          <label>Anything else?</label>
          <textarea
            placeholder="Whatever's on your mind that doesn't fit above"
            value={privateFeedback.other}
            onChange={(e) =>
              setPrivateFeedback((prev) => ({ ...prev, other: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Submit */}
      <div className="submit-section">
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Submit My Feedback ✨'}
        </button>
        <p className="submit-note">
          You can come back and submit again if things change.
        </p>
      </div>

      <footer className="footer">
        <p>
          Made with ☀️ for our February escape from winter.
        </p>
      </footer>
    </div>
  )
}

// Header component
function Header() {
  return (
    <header className="header">
      <span className="header-icon">🏰</span>
      <h1>Orlando 2026</h1>
      <p className="subtitle">Our family adventure, planned together</p>
      <span className="dates">Feb 19–23, 2026</span>
    </header>
  )
}

// Section card component
function SectionCard({ id, icon, title, date, className = '', children }) {
  return (
    <div className={`section-card ${className}`} id={id}>
      <div className="section-header">
        <span className="section-icon">{icon}</span>
        <div className="section-title-group">
          <h3 className="section-title">{title}</h3>
          {date && <span className="section-date">{date}</span>}
        </div>
      </div>
      {children}
    </div>
  )
}

// Feedback widget component
function FeedbackWidget({
  sectionId,
  feedback,
  onChange,
  existingFeedback = [],
  promptText = 'What do you think?',
}) {
  const currentFeedback = feedback[sectionId] || {}

  return (
    <div className="feedback-widget">
      <h4>💬 {promptText}</h4>

      <div className="feedback-buttons">
        <button
          className={`feedback-btn ok ${
            currentFeedback.sentiment === 'ok' ? 'selected' : ''
          }`}
          onClick={() => onChange(sectionId, 'sentiment', 'ok')}
        >
          ✅ Looks good
        </button>
        <button
          className={`feedback-btn concern ${
            currentFeedback.sentiment === 'concern' ? 'selected' : ''
          }`}
          onClick={() => onChange(sectionId, 'sentiment', 'concern')}
        >
          ⚠️ I have a concern
        </button>
      </div>

      <textarea
        className="feedback-comment"
        placeholder="Optional: Add a comment..."
        value={currentFeedback.comment || ''}
        onChange={(e) => onChange(sectionId, 'comment', e.target.value)}
      />

      {existingFeedback.length > 0 && (
        <div className="existing-feedback">
          <h5>👥 What others have said</h5>
          {existingFeedback.map((fb, i) => (
            <div
              key={i}
              className={`feedback-item ${fb.sentiment || ''}`}
            >
              <div className="feedback-meta">
                <span className="feedback-name">{fb.name}</span>
                {fb.sentiment && (
                  <span className={`feedback-sentiment ${fb.sentiment}`}>
                    {fb.sentiment === 'ok' ? '✅ Looks good' : '⚠️ Concern'}
                  </span>
                )}
              </div>
              {fb.comment && <p className="feedback-text">"{fb.comment}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
