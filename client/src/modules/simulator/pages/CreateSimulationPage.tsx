/* ─────────────────────────────────────────────────────────────
   PÁGINA: Simulador de Crédito UPB
   Descripción: Formulario de simulación de crédito educativo.
   Incluye: encabezado institucional, formulario en 3 secciones,
   sección de resultados con tabla de amortización, y pie de página.
───────────────────────────────────────────────────────────────── */

/* ── Importaciones de React y utilidades de enrutamiento ── */
import { useState, useCallback, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Importaciones de imágenes e íconos institucionales ── */
import LogoUpb from '@/assets/Images/LogoUpb.png';
import LogoUpb2 from '@/assets/Images/LogoUpb (2).png';
import LogoFacebook from '@/assets/Images/LogoFacebook.png';
import LogoInstagram from '@/assets/Images/LogoIngtagram.png';
import LogoTwitter from '@/assets/Images/LogoTwitter.png';
import LogoYoutube from '@/assets/Images/youtube_style_play_icon_512.png';

/* ─────────────────────────────────────────────────────────────
   TIPOS Y MODELOS DE DATOS
   Define los tipos TypeScript usados en el formulario y resultados.
───────────────────────────────────────────────────────────────── */

/* Tipos de selección para campos del formulario */
type StudentType = 'nuevo' | 'continuo';
type EducationLevel = '' | 'pregrado' | 'posgrado' | 'maestria' | 'doctorado';
type InterestMode = 'sin_interes' | 'con_interes';

/* Estado completo del formulario — cada campo corresponde a un input */
interface FormState {
  studentType: StudentType | '';
  educationLevel: EducationLevel;
  tuitionValue: string;
  scholarshipPercent: string;
  downPaymentPercent: string;
  downPaymentValue: string;
  interestMode: InterestMode | '';
  academicPeriod: string;
  numberOfPayments: string;
  firstPaymentMonth: string;
}

/* Errores de validación — cada campo puede tener un mensaje de error */
interface FormErrors {
  studentType?: string;
  educationLevel?: string;
  tuitionValue?: string;
  downPaymentPercent?: string;
  downPaymentValue?: string;
  interestMode?: string;
  academicPeriod?: string;
  numberOfPayments?: string;
  firstPaymentMonth?: string;
}

/* Resultado de la simulación calculada */
interface SimulationResult {
  tuitionValue: number;
  downPaymentValue: number;
  financedValue: number;
  interestMode: InterestMode;
  numberOfPayments: number;
  estimatedPayment: number;
  totalToPay: number;
  totalInterest: number;
  schedule: AmortizationRow[];
}

/* Una fila de la tabla de amortización (plan de pagos) */
interface AmortizationRow {
  period: number;
  date: string;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTES Y FUNCIONES AUXILIARES
   Valores fijos y utilidades reutilizables en todo el componente.
───────────────────────────────────────────────────────────────── */

/* Año actual — usado para mostrar los meses del selector de primera cuota */
const CURRENT_YEAR = new Date().getFullYear();

/* Lista de meses del año para el selector de fecha de primera cuota */
const MONTHS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

/* Estado inicial del formulario — valores por defecto al cargar o limpiar */
const INITIAL_FORM: FormState = {
  studentType: '',
  educationLevel: '',
  tuitionValue: '',
  scholarshipPercent: '',
  downPaymentPercent: '20',
  downPaymentValue: '',
  interestMode: '',
  academicPeriod: '',
  numberOfPayments: '',
  firstPaymentMonth: '',
};

/* Convierte un string con formato (puntos, comas, $) a número puro */
function parseNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/* Formatea un número como moneda colombiana: $ 1.500.000 */
function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/* Formatea un número con separadores de miles en español colombiano */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/* Genera la tabla de amortización (plan de pagos) cuota por cuota.
   Usa la fórmula de cuota fija para créditos con interés,
   o división simple para créditos sin interés. */
function generateMockSchedule(
  financedValue: number,
  numberOfPayments: number,
  monthlyRate: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = financedValue;
  const today = new Date();

  for (let i = 1; i <= numberOfPayments; i++) {
    const interest = Math.round(balance * monthlyRate);
    const payment =
      monthlyRate > 0
        ? Math.round(
            (financedValue * monthlyRate) /
              (1 - Math.pow(1 + monthlyRate, -numberOfPayments)),
          )
        : Math.round(financedValue / numberOfPayments);
    const principal = payment - interest;
    balance = Math.max(0, balance - principal);

    const paymentDate = new Date(today);
    paymentDate.setDate(paymentDate.getDate() + 30 * i);

    rows.push({
      period: i,
      date: paymentDate.toLocaleDateString('es-CO'),
      payment,
      interest,
      principal,
      balance: i === numberOfPayments ? 0 : balance,
    });
  }

  return rows;
}

/* Links del menú de navegación del encabezado — abren en nueva pestaña */
const NAV_LINKS = [
  { label: 'Biblioteca Virtual', href: 'https://bibliotecavirtual.upb.edu.co/pages/index.php' },
  { label: 'Transparencia', href: 'https://www.upb.edu.co/es/transparencia-acceso-informacion' },
  { label: 'Quiero Donar', href: 'https://www.upb.edu.co/es/fundacion-universitaria' },
  {
    label: 'SIGAA',
    href: 'https://sso.upb.edu.co/authenticationendpoint/login.do?Name=PreLoginRequestProcessor&commonAuthCallerPath=%252Fcas%252Flogin&forceAuth=true&passiveAuth=false&service=https%3A%2F%2Fsigaa.upb.edu.co%3A443%2Fssomanager%2Fc%2FSSB&tenantDomain=carbon.super&sessionDataKey=bf28c761-4f0e-4e79-8b20-6962fc8e4578&relyingParty=ssb-banpdn&type=cas&sp=ssb-banpdn&isSaaSApp=false&authenticators=BasicAuthenticator%3ALOCAL',
  },
  {
    label: 'Soy UPB',
    href: 'https://sso.upb.edu.co/authenticationendpoint/login.do?commonAuthCallerPath=%2Fsamlsso&forceAuth=false&passiveAuth=false&tenantDomain=carbon.super&sessionDataKey=06c9aaf1-52eb-4670-bf54-9fd17bbb57ca&relyingParty=WebcenterSt&type=samlsso&sp=Webcenterstg&isSaaSApp=false&authenticators=BasicAuthenticator%3ALOCAL',
  },
];

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTES
   Componentes reutilizables: encabezado, pie de página, errores.
───────────────────────────────────────────────────────────────── */

/* ENCABEZADO INSTITUCIONAL UPB
   Contiene: logo, menú de navegación centrado con separadores,
   botón hamburger para móvil, ícono de perfil con dropdown,
   y franja verde institucional en la parte inferior. */
function UPBHeader({
  onToggleProfile,
  profileOpen,
}: {
  onToggleProfile: () => void;
  profileOpen: boolean;
}) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <img
            src={LogoUpb}
            alt="Logo Universidad Pontificia Bolivariana"
            className="h-9 sm:h-11 w-auto flex-shrink-0"
          />

          {/* Desktop nav — ocupa el espacio central disponible */}
          <nav className="hidden md:flex flex-1 items-center justify-center" aria-label="Menú principal">
            {NAV_LINKS.map((item, idx) => (
              <span key={item.label} className="flex items-center">
                {idx > 0 && (
                  <span className="mx-4 text-gray-300 select-none" aria-hidden="true">|</span>
                )}
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15.5px] font-semibold text-gray-700 hover:text-[#6E11B0] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded px-5"
                >
                  {item.label}
                </a>
              </span>
            ))}
          </nav>

          {/* Right side: hamburger (mobile) + profile */}
          <div className="flex items-center gap-3">
            {/* Hamburger — solo mobile */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Profile icon */}
            <div className="relative">
              <button
                type="button"
                onClick={onToggleProfile}
                aria-label="Menú de perfil"
                aria-expanded={profileOpen}
                className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>

              {profileOpen && (
                <div
                  className="z-20 mt-2 w-52 rounded-xl bg-white py-1"
                  style={{ position: 'absolute', right: 0, top: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0' }}
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    Datos personales
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                    onClick={() => navigate('/login')}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3" role="navigation" aria-label="Menú móvil">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2.5 text-sm font-semibold text-gray-800 hover:text-[#6E11B0] transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}

      {/* Franja verde institucional */}
      <div className="w-full h-[10px]" style={{ backgroundColor: '#C0D901' }} />
    </header>
  );
}

/* Links de redes sociales para el pie de página */
const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/UPBBGA/?locale=es_LA', icon: LogoFacebook, alt: 'Facebook UPB' },
  { href: 'https://www.instagram.com/upbbga/?hl=es', icon: LogoInstagram, alt: 'Instagram UPB' },
  { href: 'https://x.com/UPBBGA', icon: LogoTwitter, alt: 'X (Twitter) UPB' },
  { href: 'https://www.youtube.com/channel/UCMaBLy4quJbHDcqvM9HFJ_w', icon: LogoYoutube, alt: 'YouTube UPB' },
];

/* PIE DE PÁGINA INSTITUCIONAL UPB
   Contiene: columna de contacto Bucaramanga, columna de oferta académica,
   logo UPB alternativo, íconos de redes sociales y copyright. */
function UPBFooter() {
  return (
    <footer style={{ backgroundColor: 'rgba(20,20,20,0.97)' }} className="text-gray-400 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Col izquierda */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Bucaramanga</p>
              <p className="text-sm text-gray-300 font-medium">Línea telefónica</p>
              <p className="text-sm">+57 607 6790202</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Correo electrónico</p>
              <p className="text-sm">info@upb.edu.co</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Dirección</p>
              <p className="text-sm">Campus Universitario Km 7 vía Piedecuesta</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Horarios de atención:</p>
              <p className="text-sm">Lunes a jueves 7:30 a.m. a 12:30 p.m. - 1:30 p.m. a 5:00 p.m.</p>
              <p className="text-sm">Viernes 7:30 a.m. a 10:30 p.m. - 1:30 p.m. a 4:30 p.m.</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Solo para temas judiciales</p>
              <p className="text-xs text-gray-600">notificacionesjudiciales.bga@upb.edu.co</p>
            </div>
          </div>

          {/* Col derecha */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Oferta académica</p>
              <ul className="space-y-1 text-sm">
                {['Programas profesionales', 'Posgrados', 'Programas virtuales', 'Centro de lenguas', 'Formación continua', 'Programas de hogar'].map((prog) => (
                  <li key={prog} className="text-gray-400 hover:text-gray-200 transition-colors cursor-default">{prog}</li>
                ))}
              </ul>
            </div>
            <div className="pt-2">
              <img src={LogoUpb2} alt="Logo UPB" className="h-14 w-auto" />
            </div>
          </div>
        </div>

        {/* Divider + social + copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.alt}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center hover:opacity-75 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full"
                aria-label={link.alt}
              >
                <img src={link.icon} alt={link.alt} className="w-8 h-8 object-contain block" loading="lazy" />
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-600 text-center">
            © {new Date().getFullYear()} Universidad Pontificia Bolivariana — Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

interface FieldErrorProps {
  message?: string;
}

/* Muestra un mensaje de error en rojo debajo de un campo del formulario.
   Si no hay mensaje, no renderiza nada. */
function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL: CreateSimulationPage
   Página completa del simulador de crédito educativo UPB.
   Estructura: Encabezado → Formulario (3 secciones) → Resultados → Pie de página.
───────────────────────────────────────────────────────────────── */
export function CreateSimulationPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [starred, setStarred] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [observations, setObservations] = useState('');

  const resultRef = useRef<HTMLDivElement>(null);

  /* ── Actualizadores de campos del formulario ── */
  /* updateField: actualiza cualquier campo y recalcula cuota inicial si aplica */
  /* handleDownPaymentPercentChange: sincroniza % ↔ valor COP de la cuota inicial */
  /* handleDownPaymentValueChange: sincroniza valor COP ↔ % de la cuota inicial */

  const updateField = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };

        if (field === 'tuitionValue' || field === 'scholarshipPercent') {
          const tuition = parseNumber(
            field === 'tuitionValue' ? value : prev.tuitionValue,
          );
          const scholarship = parseNumber(
            field === 'scholarshipPercent' ? value : prev.scholarshipPercent,
          );
          const netTuition = tuition * (1 - scholarship / 100);
          const pct = parseNumber(next.downPaymentPercent);
          next.downPaymentValue = Math.round(netTuition * (pct / 100)).toString();
        }

        return next;
      });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const handleDownPaymentPercentChange = useCallback(
    (value: string) => {
      setForm((prev) => {
        const pct = parseNumber(value);
        const tuition = parseNumber(prev.tuitionValue);
        const scholarship = parseNumber(prev.scholarshipPercent);
        const netTuition = tuition * (1 - scholarship / 100);
        return {
          ...prev,
          downPaymentPercent: value,
          downPaymentValue: Math.round(netTuition * (pct / 100)).toString(),
        };
      });
      setErrors((prev) => ({
        ...prev,
        downPaymentPercent: undefined,
        downPaymentValue: undefined,
      }));
    },
    [],
  );

  const handleDownPaymentValueChange = useCallback(
    (value: string) => {
      setForm((prev) => {
        const val = parseNumber(value);
        const tuition = parseNumber(prev.tuitionValue);
        const scholarship = parseNumber(prev.scholarshipPercent);
        const netTuition = tuition * (1 - scholarship / 100);
        const pct = netTuition > 0 ? (val / netTuition) * 100 : 0;
        return {
          ...prev,
          downPaymentValue: value,
          downPaymentPercent: pct.toFixed(1),
        };
      });
      setErrors((prev) => ({
        ...prev,
        downPaymentPercent: undefined,
        downPaymentValue: undefined,
      }));
    },
    [],
  );

  /* ── Validación del formulario ── */
  /* Verifica que todos los campos obligatorios estén completos y sean válidos.
     Retorna true si no hay errores, false si hay al menos uno. */

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.studentType) {
      newErrors.studentType = 'Selecciona el tipo de estudiante.';
    }
    if (!form.educationLevel) {
      newErrors.educationLevel = 'Selecciona el nivel de formación.';
    }
    if (!form.tuitionValue || parseNumber(form.tuitionValue) <= 0) {
      newErrors.tuitionValue = 'Ingresa un valor de matrícula válido.';
    }
    const pct = parseNumber(form.downPaymentPercent);
    if (pct < 20) {
      newErrors.downPaymentPercent = 'La cuota inicial debe ser al menos 20%.';
    }
    if (!form.downPaymentValue || parseNumber(form.downPaymentValue) <= 0) {
      newErrors.downPaymentValue = 'Ingresa un valor de cuota inicial válido.';
    }
    if (!form.interestMode) {
      newErrors.interestMode = 'Selecciona una modalidad de financiación.';
    }
    if (!form.academicPeriod.trim()) {
      newErrors.academicPeriod = 'Ingresa el periodo académico.';
    }
    if (
      !form.numberOfPayments ||
      parseNumber(form.numberOfPayments) <= 0 ||
      !Number.isInteger(parseNumber(form.numberOfPayments))
    ) {
      newErrors.numberOfPayments = 'Ingresa un número de cuotas válido.';
    }
    if (!form.firstPaymentMonth) {
      newErrors.firstPaymentMonth = 'Selecciona el mes de la primera cuota.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Cálculo de la simulación ── */
  /* Se ejecuta al enviar el formulario. Calcula el plan de pagos,
     total a pagar, total de intereses y cuota estimada. */

  const handleCalculate = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tuition = parseNumber(form.tuitionValue);
    const downPayment = parseNumber(form.downPaymentValue);
    const financedValue = tuition - downPayment;
    const payments = Math.round(parseNumber(form.numberOfPayments));
    const monthlyRate =
      form.interestMode === 'con_interes' ? 0.009 : 0;

    const schedule = generateMockSchedule(financedValue, payments, monthlyRate);
    const totalToPay = schedule.reduce((sum, r) => sum + r.payment, 0);
    const totalInterest = schedule.reduce((sum, r) => sum + r.interest, 0);
    const estimatedPayment = payments > 0 ? Math.round(totalToPay / payments) : 0;

    setResult({
      tuitionValue: tuition,
      downPaymentValue: downPayment,
      financedValue,
      interestMode: form.interestMode as InterestMode,
      numberOfPayments: payments,
      estimatedPayment,
      totalToPay,
      totalInterest,
      schedule,
    });

    setStarred(false);
    setObservations('');

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  /* ── Limpiar formulario ── */
  /* Restablece todos los campos al estado inicial y oculta los resultados. */

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setResult(null);
    setStarred(false);
    setObservations('');
  };

  /* ── Clases CSS reutilizables para los campos del formulario ── */
  /* inputClass: estilo del input según si tiene error o no */
  /* labelClass: estilo de las etiquetas de los campos */
  /* helperClass + helperColor: estilo del texto de ayuda bajo cada campo */

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-300 focus:border-red-400'
        : 'border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-400'
    }`;

  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  const helperClass = 'mt-1.5 text-xs leading-relaxed';
  const helperColor = { color: '#4A5565' } as const;

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#F4F1F1' }}>
      {/* ── Header ── */}
      <UPBHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((p) => !p)}
      />

      {/* ── Main ── */}
      <main
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        onClick={() => {
          if (profileOpen) setProfileOpen(false);
        }}
      >
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 tracking-tight">
          Formulario de Simulación
        </h1>

        <form onSubmit={handleCalculate} noValidate>
          {/* ── A) Información Académica ── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
              Información Académica
            </h2>

            {/* Tipo de estudiante */}
            <fieldset className="mb-5">
              <legend className={labelClass}>
                Tipo de estudiante <span className="text-red-500">*</span>
              </legend>
              <div className="flex flex-wrap gap-6 mt-1">
                {(['nuevo', 'continuo'] as const).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <input
                      type="radio"
                      name="studentType"
                      value={type}
                      checked={form.studentType === type}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateField('studentType', e.target.value)
                      }
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="capitalize">
                      Estudiante {type}
                    </span>
                  </label>
                ))}
              </div>
              <FieldError message={errors.studentType} />
            </fieldset>

            {/* Nivel de formación */}
            <div>
              <label htmlFor="educationLevel" className={labelClass}>
                Nivel de formación <span className="text-red-500">*</span>
              </label>
              <select
                id="educationLevel"
                value={form.educationLevel}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  updateField('educationLevel', e.target.value)
                }
                className={inputClass(!!errors.educationLevel)}
              >
                <option value="">Seleccionar...</option>
                <option value="pregrado">Pregrado</option>
                <option value="posgrado">Posgrado</option>
                <option value="maestria">Maestría</option>
                <option value="doctorado">Doctorado</option>
              </select>
              <FieldError message={errors.educationLevel} />
            </div>
          </section>

          {/* ── B) Datos Financieros ── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
              Datos Financieros
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Valor de matrícula */}
              <div>
                <label htmlFor="tuitionValue" className={labelClass}>
                  Valor de matrícula (COP) <span className="text-red-500">*</span>
                </label>
                <input
                  id="tuitionValue"
                  type="text"
                  inputMode="numeric"
                  placeholder="6.700.000 COP"
                  value={form.tuitionValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField('tuitionValue', e.target.value.replace(/[^0-9]/g, ''))
                  }
                  className={inputClass(!!errors.tuitionValue)}
                />
                <p className={helperClass} style={helperColor}>Valores en pesos colombianos (COP)</p>
                <FieldError message={errors.tuitionValue} />
              </div>

              {/* Beca / Descuento */}
              <div>
                <label htmlFor="scholarshipPercent" className={labelClass}>
                  Beca / Descuento (%)
                </label>
                <input
                  id="scholarshipPercent"
                  type="text"
                  inputMode="decimal"
                  placeholder="5%"
                  value={form.scholarshipPercent}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField(
                      'scholarshipPercent',
                      e.target.value.replace(/[^0-9.]/g, ''),
                    )
                  }
                  className={inputClass(false)}
                />
              </div>
            </div>

            {/* Cuota inicial */}
            <fieldset className="mt-5">
              <legend className={`${labelClass} mb-2`}>
                Cuota inicial <span className="text-red-500">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="downPaymentPercent" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Porcentaje (%)
                  </label>
                  <input
                    id="downPaymentPercent"
                    type="text"
                    inputMode="decimal"
                    placeholder="20%"
                    value={form.downPaymentPercent}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleDownPaymentPercentChange(
                        e.target.value.replace(/[^0-9.]/g, ''),
                      )
                    }
                    className={inputClass(!!errors.downPaymentPercent)}
                  />
                  <FieldError message={errors.downPaymentPercent} />
                </div>
                <div>
                  <label htmlFor="downPaymentValue" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Valor (COP)
                  </label>
                  <input
                    id="downPaymentValue"
                    type="text"
                    inputMode="numeric"
                    placeholder="1273000 COP"
                    value={form.downPaymentValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleDownPaymentValueChange(
                        e.target.value.replace(/[^0-9]/g, ''),
                      )
                    }
                    className={inputClass(!!errors.downPaymentValue)}
                  />
                  <FieldError message={errors.downPaymentValue} />
                </div>
              </div>
              <p className={helperClass} style={helperColor}>
                Modifica el porcentaje (mín. 20%) o el valor COP; el sistema recalcula automáticamente el campo restante.
              </p>
            </fieldset>
          </section>

          {/* ── C) Modalidad de Financiación ── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
              Modalidad de Financiación
            </h2>

            {/* Interés */}
            <fieldset className="mb-5">
              <legend className={labelClass}>
                Financiación <span className="text-red-500">*</span>
              </legend>
              <div className="flex flex-wrap gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="interestMode"
                    value="sin_interes"
                    checked={form.interestMode === 'sin_interes'}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateField('interestMode', e.target.value)
                    }
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  Sin intereses (0%)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="interestMode"
                    value="con_interes"
                    checked={form.interestMode === 'con_interes'}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateField('interestMode', e.target.value)
                    }
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  Con intereses (0.9% mensual M.V.)
                </label>
              </div>
              <FieldError message={errors.interestMode} />
            </fieldset>

            {/* Banner nota morado suave */}
            <div
              className="rounded-xl px-4 py-3 mb-5 text-sm"
              style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D4FF', color: '#6E11B0' }}
              role="note"
            >
              <strong>Nota:</strong> El interés se calcula mes vencido. La fecha de pago será fija cada 30 días calendario.
            </div>

            {/* Periodo académico */}
            <div className="mb-5">
              <label htmlFor="academicPeriod" className={labelClass}>
                Periodo académico <span className="text-red-500">*</span>
              </label>
              <input
                id="academicPeriod"
                type="text"
                placeholder="2025-01 / 2025-02"
                value={form.academicPeriod}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateField('academicPeriod', e.target.value)
                }
                className={inputClass(!!errors.academicPeriod)}
              />
              <FieldError message={errors.academicPeriod} />
              <p className={helperClass} style={helperColor}>
                Las cuotas se programan cada 30 días. La fecha de inicio se define tras validación institucional.
              </p>
            </div>

            {/* Fecha de pago de la primera cuota */}
            <div className="mb-5">
              <label htmlFor="firstPaymentMonth" className={labelClass}>
                Fecha de pago de la primera cuota (Mes) <span className="text-red-500">*</span>
              </label>
              <select
                id="firstPaymentMonth"
                value={form.firstPaymentMonth}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  updateField('firstPaymentMonth', e.target.value)
                }
                className={inputClass(!!errors.firstPaymentMonth)}
              >
                <option value="">Selecciona un mes — {CURRENT_YEAR}</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} {CURRENT_YEAR}
                  </option>
                ))}
              </select>
              <FieldError message={errors.firstPaymentMonth} />
              <p className={helperClass} style={helperColor}>
                Mes en que se realizará el primer pago de la cuota. Las siguientes cuotas se calcularán cada 30 días.
              </p>
            </div>

            {/* Número de cuotas */}
            <div>
              <label htmlFor="numberOfPayments" className={labelClass}>
                Número de cuotas / pagos (estimado){' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="numberOfPayments"
                type="text"
                inputMode="numeric"
                placeholder="4"
                value={form.numberOfPayments}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateField(
                    'numberOfPayments',
                    e.target.value.replace(/[^0-9]/g, ''),
                  )
                }
                className={inputClass(!!errors.numberOfPayments)}
              />
              <FieldError message={errors.numberOfPayments} />
              <p className={helperClass} style={helperColor}>
                Máximo # cuotas para esta modalidad y el número de cuotas es estimado.
              </p>
            </div>
          </section>

          {/* ── Buttons ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              type="submit"
              className="w-full sm:w-auto px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95"
              style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
            >
              Calcular Simulación
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:brightness-125 active:scale-95"
              style={{ backgroundColor: '#262626' }}
            >
              Limpiar formulario
            </button>
          </div>
        </form>

        {/* ── Results ── */}
        {result && (
          <div ref={resultRef} className="mb-10">
            {/* Header gradient */}
            <div
              className="rounded-t-2xl px-6 py-5"
              style={{ background: 'linear-gradient(90deg, #A85BFF 0%, #C0D901 100%)' }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Resumen de la Simulación
              </h2>
            </div>

            <div className="bg-white rounded-b-2xl border border-gray-200 p-5 sm:p-7" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

              {/* Summary cards — fila 1 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <SummaryCard label="Valor matrícula" value={formatCOP(result.tuitionValue)} />
                <SummaryCard label="Cuota inicial" value={formatCOP(result.downPaymentValue)} />
                <SummaryCard label="Total financiado" value={formatCOP(result.financedValue)} color="purple" />
                <SummaryCard
                  label="Modalidad"
                  value={result.interestMode === 'sin_interes' ? 'Sin intereses (0%)' : 'Con intereses (0.9% mensual)'}
                />
              </div>
              {/* Summary cards — fila 2 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                <SummaryCard label="Número de cuotas" value={String(result.numberOfPayments)} />
                <SummaryCard label="Valor cuota estimada" value={formatCOP(result.estimatedPayment)} />
                <SummaryCard label="Total a pagar" value={formatCOP(result.totalToPay)} />
                <SummaryCard label="Total intereses" value={formatCOP(result.totalInterest)} color="red" />
              </div>

              {/* Chart */}
              <div className="mb-8 bg-gray-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 text-center">
                  Distribución Capital vs Intereses
                </h3>
                <div className="flex items-center justify-center">
                  <ChartPlaceholder principal={result.financedValue} interest={result.totalInterest} />
                </div>
              </div>

              {/* Amortization table */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Tabla de Amortización
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr style={{ backgroundColor: '#262626' }}>
                        <th className="text-left px-4 py-3 font-semibold text-white">N° Cuota</th>
                        <th className="text-left px-4 py-3 font-semibold text-white">Fecha</th>
                        <th className="text-right px-4 py-3 font-semibold text-white">Saldo inicial</th>
                        <th className="text-right px-4 py-3 font-semibold text-white" style={{ color: '#A85BFF' }}>Capital</th>
                        <th className="text-right px-4 py-3 font-semibold text-white" style={{ color: '#E7000B' }}>Interés</th>
                        <th className="text-right px-4 py-3 font-semibold text-white">Valor Cuota</th>
                        <th className="text-right px-4 py-3 font-semibold text-white">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.map((row, idx) => (
                        <tr
                          key={row.period}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          style={{ borderBottom: '1px solid #f0f0f0' }}
                        >
                          <td className="px-4 py-2.5 text-gray-700">{row.period}</td>
                          <td className="px-4 py-2.5 text-gray-700">{row.date}</td>
                          <td className="text-right px-4 py-2.5 text-gray-700">
                            $ {formatNumber(result.schedule[idx - 1]?.balance ?? result.financedValue)}
                          </td>
                          <td className="text-right px-4 py-2.5 font-medium" style={{ color: '#A85BFF' }}>
                            $ {formatNumber(row.principal)}
                          </td>
                          <td className="text-right px-4 py-2.5 font-medium" style={{ color: '#E7000B' }}>
                            $ {formatNumber(row.interest)}
                          </td>
                          <td className="text-right px-4 py-2.5 text-gray-700">
                            $ {formatNumber(row.payment)}
                          </td>
                          <td className="text-right px-4 py-2.5 text-gray-700">
                            $ {formatNumber(row.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Observations */}
              <div className="mb-8">
                <label
                  htmlFor="observations"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Observaciones (Mensaje para el Administrador) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="observations"
                  rows={4}
                  placeholder="Observaciones de la Simulación..."
                  value={observations}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setObservations(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-y focus:ring-2 focus:ring-blue-300"
                  style={{ border: '1.5px solid #8CADDA', backgroundColor: '#FAFCFF' }}
                />
              </div>

              {/* Result buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                {/* Guardar simulación (disabled) */}
                <div className="relative group">
                  <button
                    type="button"
                    disabled
                    className="px-7 py-2.5 rounded-full text-white font-bold text-sm opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: '#A85BFF' }}
                    aria-describedby="save-tooltip"
                  >
                    Guardar simulación
                  </button>
                  <span
                    id="save-tooltip"
                    role="tooltip"
                    className="hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 mt-2 whitespace-nowrap"
                    style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '100%', zIndex: 10 }}
                  >
                    Disponible para usuarios autenticados
                  </span>
                </div>

                {/* Estrella toggle — pill negro */}
                <button
                  type="button"
                  onClick={() => setStarred((s) => !s)}
                  aria-label={starred ? 'Quitar destacado' : 'Destacar simulación'}
                  className="px-5 py-2.5 rounded-full font-bold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 hover:brightness-110 active:scale-95"
                  style={{
                    backgroundColor: '#262626',
                    color: starred ? '#FBBF24' : '#9CA3AF',
                  }}
                >
                  ★
                </button>

                {/* Nueva simulación — verde #C0D901 texto negro */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-7 py-2.5 rounded-full font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 hover:brightness-105"
                  style={{ backgroundColor: '#C0D901', color: '#1a1a1a' }}
                >
                  Nueva simulación
                </button>
              </div>

              {/* Banner referencial */}
              <div
                className="rounded-xl px-4 py-3 text-xs leading-relaxed"
                style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}
                role="note"
              >
                <strong>Nota:</strong> Esta es una simulación referencial. Los valores finales pueden variar según políticas institucionales vigentes. Y el botón de la estrella es para destacar esta simulación (Realizarlo antes de guardar simulación).
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <UPBFooter />
    </div>
  );
}

/* ─── Summary Card ───────────────────────────────────────── */

type SummaryCardColor = 'default' | 'purple' | 'red';

interface SummaryCardProps {
  label: string;
  value: string;
  color?: SummaryCardColor;
}

function SummaryCard({ label, value, color = 'default' }: SummaryCardProps) {
  const valueStyle: React.CSSProperties =
    color === 'purple'
      ? { color: '#A85BFF' }
      : color === 'red'
      ? { color: '#E7000B' }
      : { color: '#111827' };

  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ backgroundColor: '#F9F9FB', border: '1px solid #EBEBF0' }}
    >
      <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
      <p className="text-sm sm:text-base font-bold" style={valueStyle}>{value}</p>
    </div>
  );
}

/* ─── Chart Placeholder (SVG donut — no external lib) ──── */

interface ChartPlaceholderProps {
  principal: number;
  interest: number;
}

function ChartPlaceholder({ principal, interest }: ChartPlaceholderProps) {
  const total = principal + interest;
  const principalPct = total > 0 ? principal / total : 1;
  const interestPct = 1 - principalPct;
  const r = 60;
  const circumference = 2 * Math.PI * r;
  const principalArc = circumference * principalPct;
  const interestArc = circumference * interestPct;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Capital: ${Math.round(principalPct * 100)}%, Intereses: ${Math.round(interestPct * 100)}%`}
      >
        {/* Capital arc — morado */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="#A85BFF"
          strokeWidth="36"
          strokeDasharray={`${principalArc} ${interestArc}`}
          strokeDashoffset={circumference / 4}
        />
        {/* Intereses arc — verde institucional */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="#C0D901"
          strokeWidth="36"
          strokeDasharray={`${interestArc} ${principalArc}`}
          strokeDashoffset={circumference / 4 - principalArc}
        />
        {/* Hole */}
        <circle cx="100" cy="100" r="42" fill="white" />
        {/* Label central */}
        <text x="100" y="96" textAnchor="middle" fontSize="11" fill="#6B7280">Capital</text>
        <text x="100" y="112" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#A85BFF">
          {Math.round(principalPct * 100)}%
        </text>
      </svg>
      <div className="flex items-center gap-6 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#A85BFF' }} />
          Capital {Math.round(principalPct * 100)}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#C0D901' }} />
          Intereses {Math.round(interestPct * 100)}%
        </span>
      </div>
    </div>
  );
}
