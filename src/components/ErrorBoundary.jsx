import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              ⚠️
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-1">
              কিছু একটা সমস্যা হয়েছে
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              অ্যাপটি পুনরায় লোড করতে নিচের বাটনে চাপ দিন।
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition"
            >
              পেজ রিফ্রেশ করুন (Refresh Page)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
