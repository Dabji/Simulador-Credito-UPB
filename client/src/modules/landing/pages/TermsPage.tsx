/**
 * Página de Términos y Condiciones (issue #187)
 * Muestra el contenido completo de términos y condiciones en formato texto.
 * Diseño tipo blog/legal con descarga de PDF al final.
 */

import { useNavigate } from 'react-router-dom';
import { UpbFooter } from '@/shared/components/UpbFooter';
import LogoUpb from '@/assets/images/logo-upb.png';
import LogoUpbColor from '@/assets/images/logo-upb-color.png';
import { useState } from 'react';

export function TermsPage() {
  const navigate = useNavigate();
  const [logoHover, setLogoHover] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      {/* Header institucional con logo animado */}
      <header className="w-full bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo clickeable con animación */}
            <button
              type="button"
              onClick={() => navigate('/')}
              onMouseEnter={() => setLogoHover(true)}
              onMouseLeave={() => setLogoHover(false)}
              className="relative h-9 sm:h-11 w-[90px] sm:w-[110px] flex-shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/40 focus:ring-offset-2 overflow-hidden"
              aria-label="Ir a la página principal"
            >
              <img
                src={LogoUpb}
                alt="Logo Universidad Pontificia Bolivariana"
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-in-out"
                style={{ transform: logoHover ? 'translateY(100%)' : 'translateY(0)' }}
              />
              <img
                src={LogoUpbColor}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-in-out"
                style={{ transform: logoHover ? 'translateY(0) scale(1.35)' : 'translateY(-100%) scale(1.35)' }}
              />
            </button>

            {/* Título de la página */}
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">
              Términos y Condiciones
            </h1>

            {/* Espacio para balancear */}
            <div className="w-[90px] sm:w-[110px]" />
          </div>
        </div>
        {/* Franja verde institucional */}
        <div className="w-full h-[10px]" style={{ backgroundColor: '#C0D901' }} />
      </header>

      {/* Contenido principal - Documento en formato texto */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Título principal */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 text-center">
          Términos y Condiciones de la Página
        </h1>
        <div className="w-24 h-1 mx-auto mb-8" style={{ backgroundColor: '#A85BFF' }} />

        {/* Introducción */}
        <div className="prose prose-purple max-w-none mb-8">
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            A continuación encontrará el documento oficial de Términos y Condiciones de Uso del Simulador de Crédito Educativo. Por favor, léalo detenidamente antes de utilizar el sistema o crear una cuenta.
          </p>
        </div>

        {/* Contenido de los términos - Artículo tipo blog */}
        <article className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 lg:p-12 shadow-sm">
          {/* 1. Aspectos Generales */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              1. Aspectos Generales
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              La <strong>UNIVERSIDAD PONTIFICIA BOLIVARIANA SECCIONAL BUCARAMANGA</strong>, Institución de Educación Superior de carácter privado, de utilidad común, sin ánimo de lucro y con carácter académico de universidad, con personería jurídica reconocida mediante Resolución No. 48 del veintidós (22) de febrero de mil novecientos treinta y siete (1937), expedida por el Ministerio de Gobierno, y cuya seccional fue autorizada mediante Acuerdo No. 083 del doce (12) de julio de mil novecientos noventa (1990), expedido por el Instituto Colombiano para el Fomento de la Educación Superior (ICFES), identificada con N.I.T. 890.902.922-6 y con domicilio en la ciudad de Bucaramanga, que para efectos de los presentes Términos y Condiciones se denominará <strong>LA UNIVERSIDAD</strong>.
            </p>
          </section>

          {/* 2. Objeto y finalidad */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              2. Objeto y finalidad de la presente página
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              Los presentes Términos y Condiciones tienen por objeto regular el acceso y uso de la página institucional dispuesta por <strong>LA UNIVERSIDAD</strong>, a través del cual los usuarios podrán realizar simulaciones de financiación directa respecto de los programas académicos ofertados por la institución.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              La página tiene una finalidad informativa y orientativa, permitiendo a los usuarios conocer de manera aproximada las condiciones de financiación disponibles, sin que ello constituya una oferta vinculante, aprobación de crédito o generación de derecho alguno a favor del usuario.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              Adicionalmente, se informa que <strong>LA UNIVERSIDAD</strong> dispone de diferentes modalidades de financiación directa, las cuales se encuentran sujetas a condiciones específicas según el tipo de programa académico. En particular, existen esquemas diferenciados para estudiantes de programas académicos tradicionales de <strong>LA UNIVERSIDAD</strong> y para programas bajo la modalidad UPB TEC, cuyas condiciones, requisitos y lineamientos se encuentran definidos en los respectivos formatos de solicitud de crédito establecidos por la institución.
            </p>
          </section>

          {/* 3. Etapas del proceso */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              3. Etapas del proceso
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El uso de la página comprende: (i) simulación de condiciones financieras; (ii) eventual radicación de solicitud; (iii) verificación documental; (iv) estudio y decisión por parte de <strong>LA UNIVERSIDAD</strong>.
            </p>
          </section>

          {/* 4. Requisitos generales */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              4. Requisitos generales
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El acceso a los esquemas de financiación directa ofrecidos por <strong>LA UNIVERSIDAD</strong> se encuentra sujeto al cumplimiento de los requisitos establecidos por la institución, los cuales podrán variar según la modalidad de financiación aplicable y el tipo de programa académico.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              Con lo cual, los usuarios que se encuentren interesados en acceder deberán:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Acreditar capacidad legal para obligarse, o actuar a través de su representante legal cuando a ello haya lugar.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Suministrar información veraz, completa y actualizada.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Allegar la documentación soporte exigida por <strong>LA UNIVERSIDAD</strong>, conforme a los lineamientos definidos en los respectivos formatos de solicitud de crédito.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Cumplir con las condiciones financieras mínimas establecidas para cada modalidad de financiación.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Cuando aplique, presentar un deudor solidario que cumpla con los requisitos definidos por <strong>LA UNIVERSIDAD</strong>.
              </li>
            </ul>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              Los requisitos específicos, condiciones particulares, documentación exigida y demás lineamientos aplicables a cada modalidad de financiación se encuentran definidos en los respectivos formatos de solicitud de crédito adoptados por <strong>LA UNIVERSIDAD</strong>, los cuales hacen parte integral del proceso de evaluación.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4" style={{ borderColor: '#C0D901' }}>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                <strong>PARÁGRAFO.</strong> El incumplimiento de cualquiera de los requisitos anteriormente señalados, así como la omisión, inconsistencia o inexactitud en la información o documentación suministrada por el usuario, facultará a <strong>LA UNIVERSIDAD</strong> para abstenerse de dar trámite, suspender o no continuar con el proceso de evaluación de la solicitud de financiación, sin que ello genere derecho alguno a favor del usuario.
              </p>
            </div>
          </section>

          {/* 5. Condiciones financieras */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              5. Condiciones financieras
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              Las condiciones financieras presentadas a través de la página tienen carácter meramente informativo y referencial, y se encuentran sujetas a verificación, validación y aprobación por parte de <strong>LA UNIVERSIDAD</strong>, conforme a sus políticas internas y a los lineamientos establecidos en los respectivos formatos de solicitud de crédito.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              En este sentido, los valores, porcentajes, plazos, número de cuotas, tasas de interés y demás condiciones que puedan ser visualizadas por el usuario a través de la herramienta de simulación constituyen estimaciones preliminares, las cuales podrán variar en función de la modalidad de financiación aplicable, el tipo de programa académico y la evaluación particular de cada solicitud, con lo cual, las condiciones definitivas de financiación serán aquellas que resulten aprobadas por <strong>LA UNIVERSIDAD</strong> y formalizadas mediante los documentos correspondientes, tales como acuerdos de pago, pagarés u otros instrumentos que se suscriban para tal efecto.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              En caso de presentarse mora en el cumplimiento de las obligaciones adquiridas, <strong>LA UNIVERSIDAD</strong> podrá aplicar los intereses de mora a la tasa máxima legal vigente.
            </p>
          </section>

          {/* 6. Evaluación del acceso al crédito */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              6. Evaluación del acceso al crédito
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              <strong>LA UNIVERSIDAD</strong> se reserva la facultad de evaluar integralmente cada solicitud de financiación, de conformidad con sus políticas internas, criterios financieros, académicos y administrativos, así como con los lineamientos establecidos en los respectivos formatos de solicitud de crédito.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              En desarrollo de lo anterior, <strong>LA UNIVERSIDAD</strong> podrá:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Verificar la información suministrada por el usuario a través de cualquier medio que considere pertinente.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Solicitar información y documentación adicional cuando lo estime necesario.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Validar la capacidad de pago del solicitante y, cuando aplique, del deudor solidario.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Consultar y reportar información en centrales de riesgo, conforme a la autorización otorgada por el usuario y la normativa vigente.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Abstenerse de dar trámite o rechazar solicitudes que se encuentren incompletas, inconsistentes o que no cumplan con los requisitos establecidos.
              </li>
            </ul>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              La decisión de aprobación o negación de la financiación será adoptada de manera autónoma por <strong>LA UNIVERSIDAD</strong>, sin que exista obligación de otorgarla por el solo hecho de haber sido simulada o solicitada a través de la página.
            </p>
          </section>

          {/* 7. Tratamiento de datos personales */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              7. Tratamiento de datos personales
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El usuario, en calidad de titular de la información, autoriza de manera previa, expresa e informada a <strong>LA UNIVERSIDAD</strong> para recolectar, almacenar, usar, circular, procesar, actualizar y, en general, dar tratamiento a sus datos personales, de conformidad con lo dispuesto en la Ley 1581 de 2012, el Decreto 1377 de 2013, el Decreto Único Reglamentario 1074 de 2015 y demás normas concordantes, así como con la Política de Tratamiento de Datos Personales adoptada por la Universidad.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El tratamiento de los datos personales por parte de <strong>LA UNIVERSIDAD</strong> tendrá las siguientes finalidades:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Gestionar el acceso y uso de la página de simulación de financiación directa.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Realizar el análisis, estudio y evaluación de solicitudes de financiación.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Verificar la información suministrada por el usuario.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Contactar al usuario a través de los canales autorizados (correo electrónico, llamadas telefónicas, mensajes de texto, aplicaciones de mensajería u otros medios).
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Consultar, reportar y actualizar información en centrales de riesgo, cuando haya lugar y conforme a la autorización otorgada.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Dar cumplimiento a obligaciones legales, contractuales y regulatorias.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Implementar mecanismos de prevención del fraude, lavado de activos y financiación del terrorismo.
              </li>
            </ul>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El titular podrá ejercer en cualquier momento sus derechos de conocimiento, acceso, rectificación, actualización, supresión y revocatoria de la autorización, en los términos previstos en la normativa vigente, mediante comunicación dirigida a <a href="mailto:datos.personales.bga@upb.edu.co" className="text-purple-600 hover:text-purple-800 underline">datos.personales.bga@upb.edu.co</a> o a través de los canales institucionales dispuestos para tal efecto.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El usuario declara que la información suministrada es veraz, completa y actualizada, y autoriza a <strong>LA UNIVERSIDAD</strong> para tratar los datos personales contenidos en los presentes Términos y Condiciones, así como aquellos que se generen o recauden durante el desarrollo de la relación, para las finalidades aquí señaladas y aquellas relacionadas con la gestión académica, administrativa y financiera de la institución.
            </p>
          </section>

          {/* 8. Consulta y reporte a centrales de riesgo */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              8. Consulta y reporte a centrales de riesgo
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El usuario, en calidad de titular de la información, autoriza de manera previa, expresa e informada a <strong>LA UNIVERSIDAD</strong> para consultar, solicitar, reportar, procesar y divulgar información relacionada con su comportamiento crediticio, financiero y comercial ante operadores de información, centrales de riesgo y demás entidades que administren bases de datos con fines de información financiera, crediticia, comercial o de servicios.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              La presente autorización comprende, entre otros, los siguientes aspectos:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                La consulta de información financiera, crediticia y comercial del usuario y, cuando aplique, del deudor solidario.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                El reporte de información relacionada con el cumplimiento o incumplimiento de las obligaciones derivadas de los esquemas de financiación directa ofrecidos por <strong>LA UNIVERSIDAD</strong>.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                La actualización, modificación y rectificación de la información reportada, conforme al comportamiento del usuario.
              </li>
            </ul>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El usuario declara conocer que el reporte de información en centrales de riesgo se realizará conforme a la normativa vigente aplicable en materia de habeas data financiero, en especial la Ley 1266 de 2008 y demás disposiciones concordantes.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              Así mismo, el titular podrá ejercer sus derechos de acceso, actualización, rectificación y supresión de la información, en los términos establecidos por la ley, a través de los canales dispuestos por los operadores de información o por <strong>LA UNIVERSIDAD</strong>, según corresponda.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4" style={{ borderColor: '#C0D901' }}>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                <strong>PARÁGRAFO.</strong> La presente autorización constituye requisito necesario para el estudio y evaluación de la solicitud de financiación. En caso de no otorgarse, <strong>LA UNIVERSIDAD</strong> podrá abstenerse de dar trámite o continuar con el proceso de evaluación correspondiente.
              </p>
            </div>
          </section>

          {/* 9. Prevención de riesgos (LAFT) */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              9. Prevención de riesgos (LAFT)
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El usuario declara que los recursos utilizados o que se utilicen en el marco de los esquemas de financiación directa tienen origen lícito y no provienen de actividades ilícitas.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              Por ende, autoriza a <strong>LA UNIVERSIDAD</strong> para realizar las verificaciones que estime pertinentes, así como para solicitar información adicional, en cumplimiento de sus políticas internas de prevención de lavado de activos y financiación del terrorismo y de las disposiciones legales aplicables.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              En caso de identificarse inconsistencias, omisiones, señales de alerta o situaciones que impidan la validación del origen de los recursos, <strong>LA UNIVERSIDAD</strong> podrá abstenerse de dar trámite, suspender o no continuar con el proceso de evaluación de la solicitud, sin que ello genere derecho alguno a favor del usuario.
            </p>
          </section>

          {/* 10. Documentación soporte */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              10. Documentación soporte
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              La radicación y trámite de las solicitudes de financiación estará sujeta a la entrega de documentación completa, veraz, legible, vigente y coherente con la información suministrada por el usuario, conforme a los lineamientos definidos por <strong>LA UNIVERSIDAD</strong> en los respectivos formatos de solicitud de crédito.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              <strong>LA UNIVERSIDAD</strong> podrá requerir en cualquier momento información o documentación adicional, así como solicitar aclaraciones o subsanaciones cuando lo estime necesario.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              En caso de que la documentación aportada sea incompleta, inconsistente, ilegible o no cumpla con los requisitos establecidos, <strong>LA UNIVERSIDAD</strong> podrá abstenerse de dar trámite, suspender o rechazar la solicitud, sin que ello genere derecho alguno a favor del usuario.
            </p>
          </section>

          {/* 11. Responsabilidad */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              11. Responsabilidad
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El uso de la página se realiza bajo la exclusiva responsabilidad del usuario.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El usuario reconoce y acepta que la información, valores y condiciones que se presentan a través de la página tienen carácter meramente informativo y referencial, y que los resultados obtenidos corresponden a una simulación preliminar, la cual no constituye oferta vinculante, aprobación de financiación ni genera derecho alguno a su favor.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              En este sentido, el usuario entiende que cualquier solicitud de financiación estará sujeta a un proceso posterior de verificación, validación y evaluación por parte de <strong>LA UNIVERSIDAD</strong>, conforme a sus políticas internas y a los lineamientos establecidos en los respectivos formatos de solicitud de crédito.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              Con lo cual, <strong>LA UNIVERSIDAD</strong> no será responsable por:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Las diferencias que puedan existir entre los resultados obtenidos en la simulación y las condiciones finalmente aprobadas.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Las decisiones adoptadas por el usuario con base en la información obtenida a través de la página.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                Los errores, inconsistencias u omisiones derivadas de la información suministrada por el usuario.
              </li>
              <li className="text-gray-700 text-sm sm:text-base leading-relaxed text-justify">
                La indisponibilidad temporal de la página, así como por fallas técnicas, interrupciones o errores del sistema.
              </li>
            </ul>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              En ningún caso el uso de la página dará lugar a la configuración de expectativas legítimas de aprobación, ni a reclamaciones en contra <strong>LA UNIVERSIDAD</strong>.
            </p>
          </section>

          {/* 12. Aceptación de Términos y Condiciones */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              12. Aceptación de Términos y Condiciones
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El acceso, ingreso y uso de la página por parte del usuario implica el conocimiento, comprensión y aceptación expresa de los presentes Términos y Condiciones. En caso de no estar de acuerdo con estos, el usuario deberá abstenerse de utilizar la página.
            </p>
          </section>

          {/* 13. Modificaciones */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              13. Modificaciones
            </h2>
            <div className="h-1" />
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              <strong>LA UNIVERSIDAD</strong> se reserva el derecho de modificar, actualizar o ajustar en cualquier momento los presentes Términos y Condiciones, los cuales serán publicados a través de la página institucional.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 text-justify">
              El uso continuo de la página con posterioridad a la publicación de las modificaciones se entenderá como aceptación de los cambios realizados.
            </p>
          </section>
        </article>

        {/* Nota informativa */}
        <div className="mt-8 p-6 rounded-xl bg-purple-50 border border-purple-100">
          <h3 className="font-bold text-purple-900 text-base mb-3">Información importante</h3>
          <p className="text-purple-700 text-sm leading-relaxed">
            Al crear una cuenta en el Simulador de Crédito Educativo, usted declara haber leído, comprendido y aceptado los términos y condiciones aquí expuestos. El uso del sistema implica su conformidad con estas disposiciones. Si no está de acuerdo con estos términos, por favor absténgase de utilizar la página.
          </p>
          <p className="mt-4 text-sm text-purple-800">
            Si deseas visualizar de mejor manera estos términos y condiciones en formato PDF,{' '}
            <a
              href="/docs/requirements/terminos%20y%20condiciones%20micrositio.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:no-underline"
              style={{ color: '#2563EB' }}
            >
              dale click aquí
            </a>
            .
          </p>
        </div>

      </main>

      <UpbFooter />
    </div>
  );
}
