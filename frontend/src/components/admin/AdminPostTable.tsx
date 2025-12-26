import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, AdminPost } from '../../lib/api'

interface AdminPostTableProps {
  onPostChange?: () => void
}

export const AdminPostTable = ({ onPostChange }: AdminPostTableProps) => {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await api.admin.getPosts(10, page * 10, search)
    if (data) {
      setPosts(data.posts)
      setTotal(data.total)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [page])

  const handleSearch = () => {
    setPage(0)
    fetchPosts()
  }

  const deletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    await api.admin.deletePost(postId)
    fetchPosts()
    onPostChange?.()
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white/70 rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none"
          />
        </div>
        <span className="text-sm text-gray-500">{total} posts</span>
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Author</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Views</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Favorites</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-4">
                  <span className="font-medium text-gray-900 line-clamp-1">{p.title}</span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{p.author.username}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{p.viewCount.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{p.favorites}</td>
                <td className="px-5 py-4 text-sm text-gray-500">{formatDate(p.createdAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => deletePost(p.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-500">No posts found</div>
        )}

        {/* Pagination */}
        {posts.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {page * 10 + 1}-{Math.min((page + 1) * 10, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * 10 >= total}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AdminPostTable
