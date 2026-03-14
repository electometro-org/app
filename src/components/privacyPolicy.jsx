// src/components/privacyPolicy.jsx
import React from "react";
import { Link } from "react-router-dom";
import BackToQuizButton from "./BackToQuizButton";

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Política de Privacidad</h1>

      <p><em>Última actualización: {new Date().toLocaleDateString('es-ES')}</em></p>

      <section>
        <h2>Introducción</h2>
        <p>
          El Electómetro es un estudio público y anónimo diseñado para ayudarte a
          comparar tus opiniones políticas con las de candidatos y partidos.
          Esta política explica qué datos recopilamos, por qué los recopilamos
          y cómo los usamos.
        </p>
      </section>

      <section>
        <h2>Propósito de la Recopilación de Datos</h2>
        <p>
          <strong>Nuestro objetivo principal es mantener la integridad de este estudio. </strong>
           Como esta es una encuesta pública y anónima, somos vulnerables a:
        </p>
        <ul>
          <li>Envíos automatizados (bots)</li>
          <li>Envíos duplicados del mismo usuario</li>
          <li>Manipulación de resultados</li>
        </ul>
        <p>
          Por eso recopilamos información técnica que nos ayuda a detectar y
          prevenir estos abusos, sin comprometer tu anonimato.
        </p>
      </section>

      <section>
        <h2>Información que Recopilamos</h2>

        <h3>1. Respuestas de la Encuesta</h3>
        <p>
          Guardamos tus respuestas a las preguntas políticas y la importancia
          que le das a cada tema. Esta información es esencial para calcular
          tu compatibilidad con candidatos y partidos.
        </p>

        <h3>2. Datos Demográficos (Opcional)</h3>
        <p>
          Si decides compartirlos, recopilamos:
        </p>
        <ul>
          <li>Género</li>
          <li>Edad</li>
          <li>Nivel de educación</li>
          <li>Región y ciudad</li>
        </ul>
        <p>
          Estos datos nos ayudan a analizar tendencias generales (por ejemplo,
          "¿qué piensan los jóvenes sobre X tema?"). Son completamente opcionales.
        </p>

        <h3>3. Información Técnica del Navegador</h3>
        <p>
          Para detectar abusos, recopilamos una "huella digital" de tu navegador.
          Esta huella incluye:
        </p>
        <ul>
          <li>Tipo y versión del navegador</li>
          <li>Sistema operativo</li>
          <li>Resolución de pantalla</li>
          <li>Zona horaria</li>
          <li>Configuración de idioma</li>
        </ul>
        <p>
          <strong>Importante:</strong> Esta huella NO revela tu identidad personal.
          Es como una "firma" única de tu configuración técnica que nos ayuda a
          identificar si alguien está enviando múltiples respuestas desde el mismo dispositivo.
        </p>

        <h3>4. Cookies de Seguridad</h3>
        <p>
          Utilizamos la cookie <code>cf_clearance</code> de Cloudflare Turnstile
          para verificar que eres un humano y no un bot. Esta es una cookie de
          seguridad esencial necesaria para el funcionamiento del sitio y la
          prevención de abusos.
        </p>

        <h3>5. Estadísticas de Uso (Opcional)</h3>
        <p>
          Si aceptas compartir estadísticas de uso anónimas, recopilamos:
        </p>
        <ul>
          <li>Páginas que visitas en el sitio</li>
          <li>Tiempo que pasas en la encuesta</li>
          <li>Eventos como "quiz iniciado", "quiz completado"</li>
        </ul>
        <p>
          Esto nos ayuda a mejorar la experiencia del usuario y detectar
          comportamientos sospechosos (por ejemplo, bots que completan la encuesta
          en segundos).
        </p>
      </section>

      <section>
        <h2>Cómo Usamos Tus Datos</h2>
        <p>
          Usamos los datos recopilados exclusivamente para:
        </p>
        <ol>
          <li><strong>Calcular tus resultados:</strong> Comparar tus respuestas con las posturas de candidatos y partidos</li>
          <li><strong>Prevenir abusos:</strong> Detectar y bloquear envíos duplicados, bots y manipulación</li>
          <li><strong>Análisis de tendencias:</strong> Entender patrones generales en las opiniones (sin identificar individuos)</li>
          <li><strong>Mejorar el servicio:</strong> Optimizar la experiencia del usuario basándonos en estadísticas de uso</li>
        </ol>
        <p>
          <strong>NO usamos tus datos para:</strong>
        </p>
        <ul>
          <li>Publicidad dirigida</li>
          <li>Venta a terceros</li>
          <li>Identificarte personalmente</li>
          <li>Rastrear tu actividad fuera de este sitio</li>
        </ul>
      </section>

      <section>
        <h2>Base Legal (Ley de Protección de Datos Personales del Perú)</h2>
        <p>
          Conforme a la Ley N° 29733 - Ley de Protección de Datos Personales del Perú
          y su Reglamento (Decreto Supremo N° 003-2013-JUS), procesamos tus datos
          personales bajo las siguientes bases:
        </p>
        <ul>
          <li>
            <strong>Interés legítimo:</strong> Para prevenir fraude, abuso y manipulación
            de los resultados de este estudio público. El tratamiento de datos técnicos
            (huella digital del navegador) es necesario para garantizar la integridad
            de la encuesta.
          </li>
          <li>
            <strong>Consentimiento:</strong> Para la recopilación de estadísticas de uso
            opcionales. Tu consentimiento es libre, previo, expreso e informado, y puedes
            revocarlo en cualquier momento desde la configuración de privacidad.
          </li>
        </ul>
        <p>
          <strong>Nota:</strong> Los datos demográficos que proporcionas (género, edad,
          educación, región) son voluntarios y anónimos. No se utilizan para identificarte
          personalmente, sino solo para análisis estadísticos agregados.
        </p>
      </section>

      <section>
        <h2>Retención de Datos</h2>
        <p>
          Mantenemos los datos durante el tiempo necesario para:
        </p>
        <ul>
          <li>Proporcionar resultados agregados del estudio</li>
          <li>Detectar patrones de abuso a lo largo del tiempo</li>
          <li>Cumplir con requisitos legales</li>
        </ul>
        <p>
          Los datos pueden ser eliminados tras el cierre del estudio o a solicitud
          del usuario (ver "Tus Derechos" abajo).
        </p>
      </section>

      <section>
        <h2>Compartir Datos con Terceros</h2>
        <p>
          Solo compartimos datos con:
        </p>
        <ul>
          <li>
            <strong>Cloudflare:</strong> Para protección anti-bot (Turnstile)
          </li>
          <li>
            <strong>Proveedor de analytics:</strong> Para estadísticas de uso,
            solo si has dado consentimiento
          </li>
        </ul>
        <p>
          Todos los proveedores tienen acuerdos de procesamiento de datos que
          garantizan tu privacidad. Nunca vendemos ni compartimos tus datos
          con fines comerciales.
        </p>
      </section>

      <section>
        <h2>Tus Derechos</h2>
        <p>
          Conforme a la Ley N° 29733 - Ley de Protección de Datos Personales del Perú,
          tienes los siguientes derechos:
        </p>
        <ul>
          <li>
            <strong>Derecho de información:</strong> Ser informado sobre la recopilación
            y uso de tus datos personales (cumplido mediante esta política de privacidad)
          </li>
          <li>
            <strong>Derecho de acceso:</strong> Solicitar una copia de los datos personales
            que tenemos sobre ti
          </li>
          <li>
            <strong>Derecho de actualización, inclusión o rectificación:</strong> Corregir
            datos inexactos o incompletos
          </li>
          <li>
            <strong>Derecho de cancelación o supresión:</strong> Solicitar que eliminemos
            tus datos personales cuando ya no sean necesarios para las finalidades por
            las que fueron recopilados
          </li>
          <li>
            <strong>Derecho de oposición:</strong> Oponerte al tratamiento de tus datos
            personales para determinadas finalidades
          </li>
          <li>
            <strong>Derecho de revocación del consentimiento:</strong> Retirar tu
            consentimiento para el tratamiento de datos en cualquier momento (por ejemplo,
            cambiar tus preferencias de analytics desde la configuración de privacidad)
          </li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, <Link to="/contacto">contáctanos</Link>.
          Responderemos a tu solicitud dentro de los plazos establecidos por la ley peruana.
        </p>
        <p>
          <strong>Nota:</strong> El ejercicio de estos derechos es gratuito. Si consideras
          que tus derechos han sido vulnerados, puedes presentar una reclamación ante la
          Autoridad Nacional de Protección de Datos Personales del Perú.
        </p>
      </section>

      <section>
        <h2>Seguridad</h2>
        <p>
          Implementamos medidas técnicas y organizativas para proteger tus datos:
        </p>
        <ul>
          <li>Encriptación de datos en tránsito (HTTPS)</li>
          <li>Acceso limitado a datos personales</li>
          <li>Revisiones periódicas de seguridad</li>
        </ul>
      </section>

      <section>
        <h2>Cambios a esta Política</h2>
        <p>
          Podemos actualizar esta política ocasionalmente. Te notificaremos
          sobre cambios significativos mediante un aviso en el sitio.
        </p>
      </section>

      <section>
        <h2>Contacto</h2>
        <p>
          Si tienes preguntas sobre esta política o quieres ejercer tus derechos,
          <Link to="/contacto">contáctanos aquí</Link>.
        </p>
      </section>

      <BackToQuizButton />
    </div>
  );
}