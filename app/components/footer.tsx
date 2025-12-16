export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-lg font-bold text-[#111111] mb-4 tracking-tight">
              SIDE B
            </h3>
            <p className="text-sm text-gray-600">Editorial for Tech & Life</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] mb-4 uppercase tracking-wider">
              Sections
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a
                  href="/mobility"
                  className="hover:text-[#111111] transition-colors"
                >
                  Mobility
                </a>
              </li>
              <li>
                <a
                  href="/system"
                  className="hover:text-[#111111] transition-colors"
                >
                  System
                </a>
              </li>
              <li>
                <a
                  href="/asset"
                  className="hover:text-[#111111] transition-colors"
                >
                  Asset
                </a>
              </li>
              <li>
                <a
                  href="/kernel"
                  className="hover:text-[#111111] transition-colors"
                >
                  Kernel
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] mb-4 uppercase tracking-wider">
              About
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a
                  href="/about"
                  className="hover:text-[#111111] transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="hover:text-[#111111] transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] mb-4 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a
                  href="/privacy"
                  className="hover:text-[#111111] transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="hover:text-[#111111] transition-colors"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            © {currentYear} SIDE B. Designed & Developed with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
