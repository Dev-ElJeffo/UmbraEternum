<footer class="footer py-4 mt-5">
    <div class="container">
        <div class="row">
            <div class="col-md-6">
                <h5 class="mb-3"><i class="fas fa-moon me-2"></i>UmbraEternum</h5>
                <p class="mb-4">Um MMORPG onde você pode explorar um mundo de fantasia sombrio, enfrentar monstros e completar missões épicas.</p>
            </div>
            <div class="col-md-3">
                <h5 class="mb-3">Links Úteis</h5>
                <ul class="footer-links">
                    <li><a href="guide.php"><i class="fas fa-book me-1"></i> Guia para Iniciantes</a></li>
                    <li><a href="news.php"><i class="fas fa-newspaper me-1"></i> Últimas Notícias</a></li>
                    <li><a href="about.php"><i class="fas fa-info-circle me-1"></i> Sobre o Jogo</a></li>
                </ul>
            </div>
            <div class="col-md-3">
                <h5 class="mb-3">Contato</h5>
                <ul class="footer-links">
                    <li><a href="mailto:contato@umbraeternum.com"><i class="fas fa-envelope me-1"></i> E-mail de Suporte</a></li>
                    <li><a href="#"><i class="fab fa-discord me-1"></i> Discord</a></li>
                    <li><a href="#"><i class="fas fa-users me-1"></i> Comunidade</a></li>
                </ul>
            </div>
        </div>
        <hr class="my-4" style="border-color: #333;">
        <div class="row">
            <div class="col-md-6">
                <p class="copyright">&copy; <?php echo date('Y'); ?> UmbraEternum. Todos os direitos reservados.</p>
            </div>
            <div class="col-md-6 text-md-end">
                <div class="social-icons mb-3">
                    <a href="#"><i class="fab fa-discord"></i></a>
                    <a href="#"><i class="fab fa-facebook"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                </div>
                <p class="copyright">Versão <?php echo VERSAO; ?></p>
            </div>
        </div>
    </div>
</footer>

<!-- Scripts JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
    // Script para ocultar automaticamente as mensagens após 5 segundos
    document.addEventListener('DOMContentLoaded', function() {
        const messages = document.querySelectorAll('.message-box, .alert');
        messages.forEach(message => {
            setTimeout(() => {
                if (message.classList.contains('alert') && typeof bootstrap !== 'undefined') {
                    const bsAlert = new bootstrap.Alert(message);
                    bsAlert.close();
                } else {
                    message.style.opacity = '0';
                    setTimeout(() => {
                        message.style.display = 'none';
                    }, 500);
                }
            }, 5000);
        });
    });
</script>
</body>
</html> 