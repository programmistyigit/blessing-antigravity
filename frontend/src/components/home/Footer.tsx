export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="container mx-auto px-4 text-center">
                <h3 className="text-2xl font-bold mb-4">BLESSING</h3>
                <p className="text-gray-400 mb-6">Biz bir oilamiz.</p>
                <div className="border-t border-gray-800 pt-8 text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Blessing Company. Barcha huquqlar himoyalangan.
                </div>
            </div>
        </footer>
    );
}
