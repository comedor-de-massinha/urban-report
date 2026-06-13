import { Link } from 'react-router-dom'
import { MapPin, FilePlus, PawPrint, Bug, Hammer } from 'lucide-react'

const CATEGORIES = [
  {
    icon: <PawPrint className="w-8 h-8 text-orange-500" />,
    title: 'Animais Perdidos',
    description: 'Registre avistamentos de animais perdidos e ajude a reencontrá-los com seus tutores.',
    bg: 'bg-orange-50 border-orange-200',
  },
  {
    icon: <Bug className="w-8 h-8 text-red-500" />,
    title: 'Combate à Dengue',
    description: 'Denuncie focos de mosquito como água parada, pneus e recipientes abandonados.',
    bg: 'bg-red-50 border-red-200',
  },
  {
    icon: <Hammer className="w-8 h-8 text-purple-500" />,
    title: 'Problemas Urbanos',
    description: 'Informe buracos, lixo, iluminação danificada e outros problemas da cidade.',
    bg: 'bg-purple-50 border-purple-200',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Sua cidade mais organizada começa com você
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Registre ocorrências urbanas, acompanhe o status das denúncias e ajude a melhorar sua comunidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              <FilePlus className="w-5 h-5" /> Fazer uma denúncia
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              <MapPin className="w-5 h-5" /> Ver no mapa
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">Categorias de Ocorrências</h2>
        <p className="text-center text-gray-500 mb-12">Selecione a categoria que melhor descreve sua denúncia</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.title}
              className={`rounded-xl border-2 p-6 ${cat.bg} hover:shadow-md transition-shadow`}
            >
              <div className="mb-4">{cat.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{cat.title}</h3>
              <p className="text-gray-600 text-sm">{cat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Pronto para fazer a diferença?</h2>
        <p className="text-blue-100 mb-6">
          Registre sua ocorrência em menos de 2 minutos. Não precisa de cadastro!
        </p>
        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
        >
          <FilePlus className="w-5 h-5" /> Registrar agora
        </Link>
      </section>
    </div>
  )
}
