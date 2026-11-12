import { supabase } from './lib/supabase'
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  MapPin,
  Clock3,
  Plus,
  PackageSearch,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react'
import CatMeme from './CatMeme'

type Item = {
  id: string | number
  name: string
  image?: string
  description: string
  category: string
  location: string
  date: string
  type: 'Lost' | 'Found'
  emoji: string
  color: string
}

const categories = [
  'All items',
  'Electronics',
  'Cards',
  'Bags',
  'Accessories',
  'Personal items',
]

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All items')
  const [type, setType] = useState('All')
  const [showReport, setShowReport] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showItemDetails, setShowItemDetails] = useState(false)
  const [reportType, setReportType] = useState<'Lost' | 'Found'>('Lost')
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('Electronics')
  const [itemLocation, setItemLocation] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const loadItems = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('items')
      .select('id, title, description, category, location, type, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Could not load items:', error.message)
      setIsLoading(false)
      return
    }

    const formattedItems: Item[] = (data ?? []).map((item) => ({
      id: item.id,
      name: item.title,
      description: item.description ?? '',
      category: item.category,
      location: item.location,
      date: new Date(item.created_at).toLocaleDateString(),
      type: item.type === 'found' ? 'Found' : 'Lost',
      emoji:
        item.category === 'Electronics' ? '🎧' :
        item.category === 'Cards' ? '🪪' :
        item.category === 'Bags' ? '🎒' :
        item.category === 'Accessories' ? '⌚' : '📦',
      color: 'bg-purple-100',
    }))

    setItems(formattedItems)
    setIsLoading(false)
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setMessage('')

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        if (!data.session) {
          setMessage('Account created! Check your email to confirm it, then sign in.')
        } else {
          setShowAuth(false)
          setMessage('')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setShowAuth(false)
        setMessage('')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      alert(error.message)
      return
    }
    setUser(null)
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setShowReport(false)
      setAuthMode('login')
      setShowAuth(true)
      setMessage('Please sign in before reporting an item.')
      return
    }

    if (!itemName.trim() || !itemLocation.trim() || !itemDescription.trim()) {
      alert('Please fill in all fields.')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from('items').insert({
        title: itemName.trim(),
        description: itemDescription.trim(),
        category: itemCategory,
        location: itemLocation.trim(),
        type: reportType.toLowerCase(),
        status: 'open',
        created_by: user.id,
      })

      if (error) throw error

      setItemName('')
      setItemCategory('Electronics')
      setItemLocation('')
      setItemDescription('')
      setShowReport(false)
      setCategory('All items')
      setType('All')
      setSearch('')
      await loadItems()
      alert('Your report was submitted successfully!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not submit report.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        category === 'All items' || item.category === category

      const matchesType = type === 'All' || item.type === type

      return matchesSearch && matchesCategory && matchesType
    })
  }, [items, search, category, type])

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-[#24324A]">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              <PackageSearch size={23} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">
                BackTo<span className="text-blue-600">You</span>
              </span>
              <p className="text-[10px] font-medium tracking-widest text-slate-400">
                NEWTON SCHOOL OF TECHNOLOGY
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#browse" className="transition hover:text-blue-600">
              Browse items
            </a>
            <a href="#how-it-works" className="transition hover:text-blue-600">
              How it works
            </a>
            <button
              onClick={() => setShowReport(true)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-white transition hover:bg-blue-700"
            >
              Report an item
            </button>
            {user ? (
              <button onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50">
                Sign out
              </button>
            ) : (
              <button onClick={() => { setAuthMode('login'); setShowAuth(true) }} className="rounded-xl border border-blue-200 px-4 py-2.5 text-blue-600 hover:bg-blue-50">
                Sign in
              </button>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-slate-600 md:hidden"
            aria-label="Open report form"
            onClick={() => setShowReport(true)}
          >
            <Menu size={23} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-24 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
              <ShieldCheck size={15} />
              YOUR CAMPUS LOST & FOUND COMMUNITY
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Lost something?
              <br />
              <span className="text-blue-600">Let's get it back.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-500 md:text-lg">
              A little help from your campus community can bring your
              belongings back to you. Search, report and reconnect.
            </p>

            <div className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setReportType('Lost')
                  setShowReport(true)
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <Search size={19} />
                I lost something
              </button>

              <button
                onClick={() => {
                  setReportType('Found')
                  setShowReport(true)
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <Plus size={19} />
                I found something
              </button>
            </div>

            <p className="mt-5 text-xs text-slate-400">
              Made for the Newton School of Technology community
            </p>
          </div>
        </div>
      </header>

      {/* Browse section */}
      <section id="browse" className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold text-blue-600">
              THE CAMPUS BOARD
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Recently reported items
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Browse items reported by your campus community.
            </p>
          </div>

          <div className="flex gap-2">
            {['All', 'Lost', 'Found'].map((value) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  type === value
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-blue-50'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-400">
          <Search className="shrink-0 text-slate-400" size={21} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for an item or location..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((value) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                category === value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Item cards */}

{isLoading ? (
  <CatMeme situation="loading" />
) : items.length === 0 ? (
  <CatMeme situation="no-listings" />
) : filteredItems.length === 0 ? (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
    <CatMeme situation="no-results" />

    <div className="pb-8 text-center">
      <button
        onClick={() => {
          setSearch('')
          setCategory('All items')
          setType('All')
        }}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        Clear all filters
      </button>
    </div>
  </div>
) : (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {filteredItems.map((item) => (
      <article
        key={item.id}
        className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
      >
        <div
          className={`relative flex h-44 items-center justify-center ${item.color}`}
        >
          <span className="text-7xl transition duration-300 group-hover:scale-110">
            {item.emoji}
          </span>

          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${
              item.type === 'Lost'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {item.type}
          </span>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-800">
              {item.name}
            </h3>

            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
              {item.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={15} />
            {item.location}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock3 size={14} />
              {item.date}
            </span>

            <button
              onClick={() => {
  setSelectedItem(item)
  setShowItemDetails(true)
}}
            >
              View details <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </article>
    ))}
  </div>
)}

      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="mb-2 text-sm font-semibold text-blue-600">
              SIMPLE AND COMMUNITY-POWERED
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              How BackToYou works
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Three simple steps to help belongings find their way home.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                number: '01',
                title: 'Report an item',
                description:
                  'Tell your campus community what you lost or what you found.',
                icon: <Plus size={23} />,
              },
              {
                number: '02',
                title: 'Find a match',
                description:
                  'Browse reports and discover items that might belong to you.',
                icon: <Search size={23} />,
              },
              {
                number: '03',
                title: 'Get it back',
                description:
                  'Verify ownership and arrange a safe handover.',
                icon: <ShieldCheck size={23} />,
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFF] p-7"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  {step.icon}
                </div>
                <p className="text-xs font-bold text-blue-500">
                  STEP {step.number}
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-800">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[#F8FAFF]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-center md:flex-row md:items-center md:justify-between md:px-8 md:text-left">
          <p className="font-bold text-slate-700">
            BackToYou<span className="text-blue-600">.</span>
          </p>
          <p className="text-xs text-slate-400">
            Made with care for the Newton School of Technology community.
          </p>
        </div>
      </footer>


      {/* Authentication dialog */}
      {showAuth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleAuth}
            className="w-full max-w-md rounded-2xl border border-[#35383D] bg-[#1B1D21] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAuth(false)}
                className="text-2xl text-gray-400 hover:text-white"
                aria-label="Close sign in dialog"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full rounded-xl border border-[#35383D] bg-[#282B30] p-3 text-white outline-none"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (at least 6 characters)"
                className="w-full rounded-xl border border-[#35383D] bg-[#282B30] p-3 text-white outline-none"
              />
            </div>

            {message && (
              <p className="mt-4 text-sm text-purple-300">{message}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="mt-5 w-full rounded-xl bg-[#A78BFA] py-3 font-bold text-black disabled:opacity-50"
            >
              {authLoading
                ? 'Please wait...'
                : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            <p className="mt-4 text-center text-sm text-gray-400">
              {authMode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login')
                  setMessage('')
                }}
                className="font-semibold text-purple-300"
              >
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>
      )}

{/* Report item dialog */}
{showReport && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <form
      onSubmit={handleReportSubmit}
      className="w-full max-w-lg rounded-2xl border border-[#35383D] bg-[#1B1D21] p-6 shadow-2xl"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#F5F5F0]">
          Report an item
        </h2>
        <button
          type="button"
          onClick={() => setShowReport(false)}
          className="text-2xl text-[#A5A6A2] hover:text-white"
        >
          ×
        </button>
      </div>

      <p className="mb-4 text-sm text-[#A5A6A2]">
        Help your campus community reunite with their belongings.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {(['Lost', 'Found'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setReportType(value)}
            className={`rounded-xl border p-3 font-semibold ${
              reportType === value
                ? 'border-[#A78BFA] bg-[#2A2140] text-[#A78BFA]'
                : 'border-[#35383D] text-[#A5A6A2]'
            }`}
          >
            {value === 'Lost' ? 'I lost something' : 'I found something'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-[#F5F5F0]">
            Item name
          </label>
          <input
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Black backpack"
            className="w-full rounded-xl border border-[#35383D] bg-[#282B30] p-3 text-white outline-none focus:border-[#A78BFA]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-[#F5F5F0]">
            Category
          </label>
          <select
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            className="w-full rounded-xl border border-[#35383D] bg-[#282B30] p-3 text-white outline-none"
          >
            {categories.filter((c) => c !== 'All items').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-[#F5F5F0]">
            Location
          </label>
          <input
            required
            value={itemLocation}
            onChange={(e) => setItemLocation(e.target.value)}
            placeholder="Where was it lost or found?"
            className="w-full rounded-xl border border-[#35383D] bg-[#282B30] p-3 text-white outline-none focus:border-[#A78BFA]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-[#F5F5F0]">
            Description
          </label>
          <textarea
            required
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="Describe the item..."
            rows={3}
            className="w-full resize-none rounded-xl border border-[#35383D] bg-[#282B30] p-3 text-white outline-none focus:border-[#A78BFA]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 w-full rounded-xl bg-[#A78BFA] py-3 font-bold text-black hover:bg-[#8B5CF6] disabled:opacity-50"
      >
        {isLoading ? 'Submitting...' : 'Submit report'}
      </button>
    </form>
  </div>
)}

            {/* Item details dialog */}
      {showItemDetails && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#35383D] bg-[#1B1D21] p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#F5F5F0]">
                Item details
              </h2>

              <button
                onClick={() => setShowItemDetails(false)}
                className="text-[#A5A6A2] hover:text-white"
                aria-label="Close details"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mb-5 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-[#282B30]">
  {selectedItem.image ? (
    <img
      src={selectedItem.image}
      alt="Uploaded item"
      className="h-full w-full object-contain"
    />
  ) : (
    <span className="text-7xl">{selectedItem.emoji}</span>
  )}
</div>

            <h3 className="mb-3 text-2xl font-bold text-[#F5F5F0]">
              {selectedItem.name}
            </h3>
            <p className="mb-5 text-sm leading-6 text-[#A5A6A2]">
  {selectedItem.description}
</p>

            <div className="space-y-4 text-sm text-[#A5A6A2]">
              <p>
                <strong className="text-[#F5F5F0]">Status:</strong> {selectedItem.type}
                </p>
              <p>
    <strong className="text-[#F5F5F0]">Category:</strong> {selectedItem.category}
  </p>
  <p>
    <strong className="text-[#F5F5F0]">Location:</strong> {selectedItem.location}
  </p>
  <p>
    <strong className="text-[#F5F5F0]">Reported:</strong> {selectedItem.date}
  </p>
</div>
            

            <button
              onClick={() => setShowItemDetails(false)}
              className="mt-7 w-full rounded-xl bg-[#A78BFA] py-3 font-semibold text-black hover:bg-[#8B5CF6]"
            >
              Close
            </button>
</div>
          </div>

      )}
    </div>
  )
}

export default App

