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
  User,
  Phone,
  Mail,
  Camera,
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
  reporterName?: string
  contactInfo?: string
}

const categories = [
  'All items',
  'Electronics',
  'Cards',
  'Bags',
  'Accessories',
  'Personal items',
]

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(event.target?.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = event.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

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
  const [reporterName, setReporterName] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [itemImage, setItemImage] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
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

  useEffect(() => {
    if (user && showReport) {
      if (!reporterName && (user.user_metadata?.full_name || user.user_metadata?.name)) {
        setReporterName(user.user_metadata.full_name || user.user_metadata.name)
      }
      if (!contactInfo && user.email) {
        setContactInfo(user.email)
      }
    }
  }, [user, showReport])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please choose a smaller photo.')
      return
    }

    try {
      setImageLoading(true)
      const compressed = await compressImage(file)
      setItemImage(compressed)
    } catch (err) {
      console.error('Failed to process image:', err)
      alert('Could not process this image. Please try another one.')
    } finally {
      setImageLoading(false)
    }
  }

  const loadItems = async () => {
    setIsLoading(true)

    let { data, error } = await supabase
      .from('items')
      .select('id, title, description, category, location, type, created_at, reporter_name, contact_info, image_url')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    // If image_url, reporter_name or contact_info columns don't exist yet in Supabase schema, fallback cleanly
    if (error && (error.message.includes('image_url') || error.message.includes('reporter_name') || error.message.includes('contact_info') || error.message.includes('column'))) {
      const fallback = await supabase
        .from('items')
        .select('id, title, description, category, location, type, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      data = fallback.data as any
      error = fallback.error
    }

    if (error) {
      console.error('Could not load items:', error.message)
      setIsLoading(false)
      return
    }

    const formattedItems: Item[] = (data ?? []).map((item: any) => {
      let description = item.description ?? ''
      let repName = item.reporter_name
      let contact = item.contact_info
      let img = item.image_url

      // Parse fallback format if image was embedded in description
      if (!img) {
        const imgMatch = description.match(/\[Image: (.*?)\]/)
        if (imgMatch) {
          img = imgMatch[1]
          description = description.replace(/\n\n\[Image: .*?\]/, '').replace(/\[Image: .*?\]/, '')
        }
      }

      // Parse fallback format if reporter details were embedded in description
      if (!repName && !contact) {
        const contactMatch = description.match(/\[Reported by: (.*?) \| Contact: (.*?)\]/)
        if (contactMatch) {
          repName = contactMatch[1] !== 'Anonymous' ? contactMatch[1] : undefined
          contact = contactMatch[2] !== 'N/A' ? contactMatch[2] : undefined
          description = description.replace(/\n\n\[Reported by: .*? \| Contact: .*?\]/, '').replace(/\[Reported by: .*? \| Contact: .*?\]/, '')
        }
      }

      return {
        id: item.id,
        name: item.title,
        image: img,
        description,
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
        reporterName: repName,
        contactInfo: contact,
      }
    })

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

    if (
      !itemName.trim() ||
      !itemLocation.trim() ||
      !itemDescription.trim() ||
      !reporterName.trim() ||
      !contactInfo.trim()
    ) {
      alert('Please fill in all fields including your name and contact details.')
      return
    }

    setIsLoading(true)
    try {
      const payload: Record<string, any> = {
        title: itemName.trim(),
        description: itemDescription.trim(),
        category: itemCategory,
        location: itemLocation.trim(),
        type: reportType.toLowerCase(),
        status: 'open',
        created_by: user.id,
        reporter_name: reporterName.trim(),
        contact_info: contactInfo.trim(),
      }
      if (itemImage) {
        payload.image_url = itemImage
      }

      const { error } = await supabase.from('items').insert(payload)

      if (error) {
        // If columns don't exist yet in Supabase schema, safely fallback to embedding in description
        if (
          error.message.includes('image_url') ||
          error.message.includes('reporter_name') ||
          error.message.includes('contact_info') ||
          error.message.includes('column')
        ) {
          let fallbackDesc = itemDescription.trim()
          if (itemImage) {
            fallbackDesc += `\n\n[Image: ${itemImage}]`
          }
          fallbackDesc += `\n\n[Reported by: ${reporterName.trim()} | Contact: ${contactInfo.trim()}]`

          const { error: fallbackError } = await supabase.from('items').insert({
            title: itemName.trim(),
            description: fallbackDesc,
            category: itemCategory,
            location: itemLocation.trim(),
            type: reportType.toLowerCase(),
            status: 'open',
            created_by: user.id,
          })
          if (fallbackError) throw fallbackError
        } else {
          throw error
        }
      }

      setItemName('')
      setItemCategory('Electronics')
      setItemLocation('')
      setItemDescription('')
      setReporterName('')
      setContactInfo('')
      setItemImage('')
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

          <div className="flex items-center gap-1.5 rounded-xl border border-[#C8D9E6] bg-white p-1 shadow-sm">
            {['All', 'Lost', 'Found'].map((value) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  type === value
                    ? 'bg-[#2F4156] text-white shadow-sm'
                    : 'text-[#567C8D] hover:bg-[#F5EFEB] hover:text-[#2F4156]'
                }`}
              >
                {value === 'All' ? 'All items' : value}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5 flex items-center gap-3 rounded-2xl border border-[#C8D9E6] bg-white px-4 py-3.5 shadow-sm transition-all focus-within:border-[#2F4156] focus-within:ring-2 focus-within:ring-[#C8D9E6]/60">
          <Search className="shrink-0 text-[#567C8D]" size={20} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for an item or location..."
            className="w-full bg-transparent text-sm text-[#2F4156] outline-none placeholder:text-[#567C8D]/70"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="rounded-full p-1 text-[#567C8D] transition hover:bg-[#F5EFEB] hover:text-[#2F4156]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="mb-8 flex gap-2.5 overflow-x-auto pb-2">
          {categories.map((value) => {
            const isSelected = category === value
            return (
              <button
                key={value}
                onClick={() => setCategory(value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 ${
                  isSelected
                    ? 'border border-[#2F4156] bg-[#2F4156] text-white shadow-md shadow-[#2F4156]/15'
                    : 'border border-[#C8D9E6] bg-white text-[#567C8D] hover:border-[#567C8D] hover:bg-[#F5EFEB] hover:text-[#2F4156]'
                }`}
              >
                {value}
              </button>
            )
          })}
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
        className="group overflow-hidden rounded-2xl border border-[#C8D9E6] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2F4156]/10"
      >
        <div
          className="relative flex h-48 items-center justify-center overflow-hidden border-b border-[#C8D9E6]/60 bg-[#E3EDF4] transition duration-200 group-hover:bg-[#D8E6F0]"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-7xl transition duration-300 group-hover:scale-110">
              {item.emoji}
            </span>
          )}

          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
              item.type === 'Lost'
                ? 'border border-[#C05638]/30 bg-[#FDF0EC] text-[#C05638]'
                : 'border border-[#567C8D]/30 bg-white text-[#567C8D]'
            }`}
          >
            {item.type}
          </span>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-[#2F4156]">
              {item.name}
            </h3>

            <span className="shrink-0 rounded-md border border-[#C8D9E6] bg-[#F5EFEB] px-2 py-1 text-[10px] font-bold text-[#567C8D]">
              {item.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#567C8D]">
            <MapPin size={15} />
            {item.location}
          </div>

          {item.reporterName && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#567C8D]">
              <User size={13} className="text-[#567C8D]" />
              <span>
                Reported by <strong className="font-semibold text-[#2F4156]">{item.reporterName}</strong>
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-[#C8D9E6]/60 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-[#567C8D]">
              <Clock3 size={14} />
              {item.date}
            </span>

            <button
              onClick={() => {
                setSelectedItem(item)
                setShowItemDetails(true)
              }}
              className="flex items-center gap-1 text-xs font-semibold text-[#567C8D] hover:text-[#2F4156] transition"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2F4156]/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAuth}
            className="w-full max-w-md rounded-2xl border border-[#C8D9E6] bg-white p-6 shadow-2xl shadow-[#2F4156]/15"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2F4156]">
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAuth(false)}
                className="text-2xl text-[#567C8D] hover:text-[#2F4156]"
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
                className="w-full rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-3 text-[#2F4156] outline-none placeholder:text-[#567C8D]/70 focus:border-[#2F4156] focus:bg-white transition"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (at least 6 characters)"
                className="w-full rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-3 text-[#2F4156] outline-none placeholder:text-[#567C8D]/70 focus:border-[#2F4156] focus:bg-white transition"
              />
            </div>

            {message && (
              <p className="mt-4 text-sm font-medium text-[#C05638]">{message}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="mt-5 w-full rounded-xl bg-[#2F4156] py-3 font-bold text-white shadow-md shadow-[#2F4156]/20 transition hover:bg-[#1E2B3A] disabled:opacity-50"
            >
              {authLoading
                ? 'Please wait...'
                : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            <p className="mt-4 text-center text-sm text-[#567C8D]">
              {authMode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login')
                  setMessage('')
                }}
                className="font-bold text-[#2F4156] hover:underline"
              >
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>
      )}

{/* Report item dialog */}
{showReport && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F4156]/50 backdrop-blur-sm p-4">
    <form
      onSubmit={handleReportSubmit}
      className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#C8D9E6] bg-white p-6 shadow-2xl shadow-[#2F4156]/15"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2F4156]">
          Report an item
        </h2>
        <button
          type="button"
          onClick={() => setShowReport(false)}
          className="text-2xl text-[#567C8D] hover:text-[#2F4156]"
        >
          ×
        </button>
      </div>

      <p className="mb-4 text-sm text-[#567C8D]">
        Help your campus community reunite with their belongings.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {(['Lost', 'Found'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setReportType(value)}
            className={`rounded-xl border p-3 font-semibold transition ${
              reportType === value
                ? value === 'Lost'
                  ? 'border-[#C05638] bg-[#FDF0EC] text-[#C05638]'
                  : 'border-[#567C8D] bg-[#DCE8EF] text-[#567C8D]'
                : 'border-[#C8D9E6] text-[#567C8D] hover:bg-[#F5EFEB]'
            }`}
          >
            {value === 'Lost' ? 'I lost something' : 'I found something'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#2F4156]">
            Item name
          </label>
          <input
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Black backpack"
            className="w-full rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-3 text-[#2F4156] outline-none placeholder:text-[#567C8D]/70 focus:border-[#2F4156] focus:bg-white transition"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#2F4156]">
            Category
          </label>
          <select
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            className="w-full rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-3 text-[#2F4156] outline-none focus:border-[#2F4156] focus:bg-white transition"
          >
            {categories.filter((c) => c !== 'All items').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#2F4156]">
            Location
          </label>
          <input
            required
            value={itemLocation}
            onChange={(e) => setItemLocation(e.target.value)}
            placeholder="Where was it lost or found?"
            className="w-full rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-3 text-[#2F4156] outline-none placeholder:text-[#567C8D]/70 focus:border-[#2F4156] focus:bg-white transition"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#2F4156]">
            Description
          </label>
          <textarea
            required
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="Describe the item..."
            rows={3}
            className="w-full resize-none rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-3 text-[#2F4156] outline-none placeholder:text-[#567C8D]/70 focus:border-[#2F4156] focus:bg-white transition"
          />
        </div>

        {/* Optional Photo Upload */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-[#2F4156]">
              Photo
            </label>
            <span className="text-xs text-[#567C8D]">Optional</span>
          </div>

          {itemImage ? (
            <div className="relative overflow-hidden rounded-xl border border-[#C8D9E6] bg-[#E3EDF4]">
              <img
                src={itemImage}
                alt="Selected item"
                className="h-44 w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setItemImage('')}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#2F4156]/80 text-white backdrop-blur transition hover:bg-[#2F4156]"
                title="Remove photo"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label
              htmlFor="item-photo-upload"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#C8D9E6] bg-[#F5EFEB] p-5 text-center transition hover:border-[#567C8D] hover:bg-[#E3EDF4]/60 ${
                imageLoading ? 'opacity-50' : ''
              }`}
            >
              <Camera size={26} className="mb-2 text-[#567C8D]" />
              <p className="text-sm font-semibold text-[#2F4156]">
                {imageLoading ? 'Processing photo...' : 'Add a photo of the item'}
              </p>
              <p className="mt-1 text-xs text-[#567C8D]">
                PNG, JPG or WEBP (up to 5MB, optional)
              </p>
              <input
                id="item-photo-upload"
                type="file"
                accept="image/*"
                disabled={imageLoading}
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#2F4156]">
              Your Name
            </label>
            <input
              required
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="e.g. Alex Sharma"
              className="w-full rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-3 text-[#2F4156] outline-none placeholder:text-[#567C8D]/70 focus:border-[#2F4156] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#2F4156]">
              Contact Details
            </label>
            <input
              required
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Phone, WhatsApp, or email"
              className="w-full rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-3 text-[#2F4156] outline-none placeholder:text-[#567C8D]/70 focus:border-[#2F4156] focus:bg-white transition"
            />
          </div>
        </div>
        <p className="text-xs text-[#567C8D]">
          This allows students to reach you directly to claim or hand over the item.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || imageLoading}
        className="mt-6 w-full rounded-xl bg-[#2F4156] py-3 font-bold text-white shadow-md shadow-[#2F4156]/20 transition hover:bg-[#1E2B3A] disabled:opacity-50"
      >
        {isLoading ? 'Submitting...' : 'Submit report'}
      </button>
    </form>
  </div>
)}

            {/* Item details dialog */}
      {showItemDetails && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F4156]/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#C8D9E6] bg-white p-6 shadow-2xl shadow-[#2F4156]/15">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2F4156]">
                Item details
              </h2>

              <button
                onClick={() => setShowItemDetails(false)}
                className="text-[#567C8D] hover:text-[#2F4156]"
                aria-label="Close details"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mb-5 flex h-44 items-center justify-center overflow-hidden rounded-xl border border-[#C8D9E6] bg-[#E3EDF4]">
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

            <h3 className="mb-3 text-2xl font-bold text-[#2F4156]">
              {selectedItem.name}
            </h3>
            <p className="mb-5 text-sm leading-6 text-[#567C8D]">
  {selectedItem.description}
</p>

            <div className="space-y-3 text-sm text-[#567C8D]">
              <p>
                <strong className="text-[#2F4156]">Status:</strong> {selectedItem.type}
              </p>
              <p>
                <strong className="text-[#2F4156]">Category:</strong> {selectedItem.category}
              </p>
              <p>
                <strong className="text-[#2F4156]">Location:</strong> {selectedItem.location}
              </p>
              <p>
                <strong className="text-[#2F4156]">Reported:</strong> {selectedItem.date}
              </p>
            </div>

            {/* Reporter details card */}
            <div className="mt-5 rounded-xl border border-[#C8D9E6] bg-[#F5EFEB] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#567C8D]">
                {selectedItem.type === 'Found' ? 'Found & Reported By' : 'Lost & Reported By'}
              </p>
              <div className="mt-2.5 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#2F4156]">
                  <User size={15} className="text-[#567C8D]" />
                  <span>
                    <strong className="text-[#567C8D]">Name:</strong>{' '}
                    {selectedItem.reporterName || 'Anonymous / Not specified'}
                  </span>
                </div>
                {selectedItem.contactInfo && (
                  <div className="flex items-center gap-2 text-[#2F4156]">
                    {selectedItem.contactInfo.includes('@') ? (
                      <Mail size={15} className="text-[#567C8D]" />
                    ) : (
                      <Phone size={15} className="text-[#567C8D]" />
                    )}
                    <span>
                      <strong className="text-[#567C8D]">Contact:</strong>{' '}
                      <span className="font-medium text-[#2F4156]">{selectedItem.contactInfo}</span>
                    </span>
                  </div>
                )}
              </div>

              {selectedItem.contactInfo && (
                <div className="mt-4 flex gap-2">
                  {selectedItem.contactInfo.includes('@') ? (
                    <a
                      href={`mailto:${selectedItem.contactInfo}?subject=${encodeURIComponent(
                        `BackToYou: Regarding "${selectedItem.name}"`
                      )}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2F4156] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1E2B3A]"
                    >
                      <Mail size={14} /> Send Email
                    </a>
                  ) : (
                    <>
                      <a
                        href={`tel:${selectedItem.contactInfo}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2F4156] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1E2B3A]"
                      >
                        <Phone size={14} /> Call
                      </a>
                      <a
                        href={`https://wa.me/${selectedItem.contactInfo.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#567C8D]/40 bg-white px-4 py-2.5 text-xs font-bold text-[#567C8D] transition hover:bg-[#DCE8EF]"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
            

            <button
              onClick={() => setShowItemDetails(false)}
              className="mt-7 w-full rounded-xl bg-[#2F4156] py-3 font-semibold text-white shadow-md shadow-[#2F4156]/20 transition hover:bg-[#1E2B3A]"
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

