export default function TestCSS() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Testing CSS
      </h1>
      <div className="bg-green-200 p-4 rounded-lg shadow-md">
        <p className="text-green-800">This box should be green with green text</p>
      </div>
      <div className="mt-4">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Button with Tailwind styles
        </button>
      </div>
    </div>
  );
} 