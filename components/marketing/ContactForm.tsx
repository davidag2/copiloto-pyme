export function ContactForm() {
  return (
    <form className="mkt-contact-form">
      <label>Nombre<input placeholder="Tu nombre" /></label>
      <label>Empresa<input placeholder="Nombre de la empresa" /></label>
      <label>Email<input type="email" placeholder="correo@empresa.com" /></label>
      <label>Teléfono<input placeholder="+57 300 000 0000" /></label>
      <label>Mensaje<textarea placeholder="Cuéntanos cómo registras ventas, caja, inventario y clientes hoy." /></label>
      <button className="mkt-button primary" type="submit">Solicitar demo</button>
    </form>
  );
}
