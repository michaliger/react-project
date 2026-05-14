import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UploadCloud, FileSpreadsheet, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminExcelUpload() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  
  // בדיקת הרשאות - רק מנהל יכול לראות את העמוד הזה!
  const isAdmin = currentUser && currentUser.role === 'admin';
  
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [excelData, setExcelData] = useState(null);

  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50" dir="rtl">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-800 mb-2">גישה נדחתה</h1>
        <p className="text-slate-600 mb-6">אין לך הרשאות מנהל כדי לצפות בעמוד זה.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">חזרה לספרייה</button>
      </div>
    );
  }

  // פונקציה שמטפלת בהעלאת הקובץ
  const handleFileUpload = (uploadedFile) => {
    if (!uploadedFile) return;
    
    // מוודאים שזה קובץ אקסל
    if (!uploadedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      alert('נא להעלות קובץ אקסל תקין (.xlsx, .xls)');
      return;
    }

    setFile(uploadedFile);

    // קריאת הקובץ בעזרת הספרייה שהתקנו
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0]; // לוקחים את הגיליון הראשון
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      console.log("הנתונים שנקראו מהאקסל:", json);
      setExcelData(json);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileUpload(droppedFile);
  };

  const handleProcessData = () => {
    // כאן תיכנס הלוגיקה שלנו שתסדר את הנתונים ותשלח לשרת!
    // בינתיים אנחנו רק מציגים הודעה:
    alert('ברגע שנגדיר את התבנית, הכפתור הזה ישלח את כל הנתונים לשרת!');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans" dir="rtl">
      <div className="max-w-3xl mx-auto">
        
        {/* כותרת עליונה */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={28} />
              ייבוא סדרות מאקסל
            </h1>
            <p className="text-slate-500 text-sm mt-1">העלאה מרוכזת של סדרות, גליונות ומאמרים למסד הנתונים</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg border shadow-sm font-bold transition-colors"
          >
            חזרה לספרייה <ArrowRight size={16} />
          </button>
        </div>

        {/* אזור העלאת הקובץ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <div className="bg-emerald-100 p-4 rounded-full mb-4">
                  <CheckCircle2 size={48} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{file.name}</h3>
                <p className="text-slate-500 text-sm mb-6">הקובץ נקרא בהצלחה ({excelData?.length || 0} שורות נמצאו)</p>
                <button 
                  onClick={() => setFile(null)}
                  className="text-sm font-bold text-red-500 hover:text-red-700"
                >
                  הסר קובץ והעלה מחדש
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center cursor-pointer" onClick={() => document.getElementById('excel-upload').click()}>
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <UploadCloud size={48} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">לחץ להעלאה או גרור קובץ לכאן</h3>
                <p className="text-slate-500 text-sm mb-4">תומך בקבצי .xlsx, .xls</p>
                <input 
                  type="file" 
                  id="excel-upload" 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => handleFileUpload(e.target.files[0])} 
                />
              </div>
            )}
          </div>

          {/* כפתור אישור סופי (מופיע רק אחרי שהועלה קובץ) */}
          {file && (
            <div className="mt-8 border-t pt-6 flex justify-end">
              <button 
                onClick={handleProcessData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black text-lg shadow-md transition-colors flex items-center gap-2"
              >
                <Database size={20} />
                הכנס נתונים למערכת
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}