import { useEffect, useState } from 'react'
import { DocumentUpload } from '../components/documents/DocumentUpload'
import { DocumentList } from '../components/documents/DocumentList'
import { DocumentViewer } from '../components/documents/DocumentViewer'
import { Database } from '../types/database.types'
import { supabase } from '../lib/supabase'

type Document = Database['public']['Tables']['documents']['Row']

export function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) throw error
        if (isMounted) setUserId(user?.id ?? null)
      } catch (error) {
        console.error('Erro ao verificar usuário atual:', error)
        if (isMounted) {
          setUserError('Não foi possível verificar sua sessão. Tente novamente.')
        }
      } finally {
        if (isMounted) setIsLoadingUser(false)
      }
    }

    void loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Verificando sessão...</p>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-500">{userError}</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">
          Por favor, faça login para acessar os documentos
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Seção de Upload */}
        <div>
          <h1 className="text-2xl font-bold mb-4">Upload de Documentos</h1>
          <DocumentUpload
            userId={userId}
            onSuccess={() => {
              // Força atualização da lista
              setSelectedDocument(null)
            }}
          />
        </div>

        {/* Seção de Lista */}
        <div>
          <h1 className="text-2xl font-bold mb-4">Seus Documentos</h1>
          <DocumentList
            userId={userId}
            onSelect={setSelectedDocument}
            onDelete={() => setSelectedDocument(null)}
          />
        </div>
      </div>

      {/* Visualizador de Documentos */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  )
}
