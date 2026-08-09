import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UploadCloud, FileSpreadsheet, ArrowRight, AlertTriangle, CheckCircle2, Database, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api'; 

export default function AdminExcelUpload() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  const isAdmin = currentUser && currentUser.role === 'admin';

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [excelData, setExcelData] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState(null);

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

  const handleFileUpload = (uploadedFile) => {
    setError(null);
    if (!uploadedFile) return;
    
    if (!uploadedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('נא להעלות קובץ אקסל תקין (.xlsx, .xls)');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const allSheetsData = {};
        
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          allSheetsData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
        });
        
        setExcelData(allSheetsData);
        setPreviewMode(true);
      } catch (err) {
        setError('שגיאה בקריאת הקובץ. ודא שהקובץ תקין.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleProcessData = async () => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          if (!excelData) {
      setError("לא נמצאו נתונים לעיבוד בקובץ.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // איתור הטאבים - תומך בעברית
      const sheetNames = Object.keys(excelData);
      const headerSheet = excelData['הכותר'] || excelData['כותר'] || excelData[sheetNames[0]] || [];
      const volumesRows = excelData['הגליונות'] || excelData['גליונות'] || excelData[sheetNames[1]] || [];
      const articlesRows = excelData['המאמרים'] || excelData['מאמרים'] || excelData[sheetNames[2]] || [];

      // בדיקה שיש נתונים
      if (headerSheet.length === 0) {
        setError("טאב הכותר ריק. נא וודא שקובץ ה-Excel תקין.");
        setIsProcessing(false);
        return;
      }

      // שליפת הנתונים של הסדרה מהשורה הראשונה של הכותר
      const headerRow = headerSheet[0];
      
      const seriesPayload = {
        seriesData: {
          prefixName: headerRow['אופי הכותר']?.toString().trim() || 'קובץ',  // ✅ אופי הכותר!
          fileName: headerRow['שם הכותר']?.toString().trim() || 'סדרה',      // ✅ שם הכותר!
          identifierName: headerRow['שם מזהה']?.toString().trim() || '',
          details: headerRow['פרטי הקובץ']?.toString().trim() || '',
          editor: headerRow['שם העורך']?.toString().trim() || '',
          publicationPlace: headerRow['מקום הוצאה']?.toString().trim() || '',
          sector: headerRow['מגזר']?.toString().trim() || '',
          missingVolumesList: headerRow['גליונות חסרים']?.toString().trim() || '',
          adminNotes: headerRow['הערות מנהל']?.toString().trim() || '',
          catalogStatus: headerRow['סטטוס']?.toString().trim() || 'ממתין',
          enteredBy: currentUser?.username || headerRow['הוזן ע"י']?.toString().trim() || 'מנהל'
        },
        volumesMap: {}
      };

      // 1. שלב ראשון: מעבר על טאב הגליונות ומיפוי לפי מ"ס
      volumesRows.forEach((row) => {
        const volumeNum = row["מ\"ס"]?.toString().trim() || row["מספר"]?.toString().trim();
        if (!volumeNum) return;

        seriesPayload.volumesMap[volumeNum] = {
          volumeNumber: parseInt(volumeNum) || 1,
          volumeTitle: row['שם גליון']?.toString().trim() || `גליון ${volumeNum}`,
          mainTopic: row['נושא ראשי']?.toString().trim() || '',
          publishedFor: row['יצא לרגל']?.toString().trim() || '',
          volumeEditor: row['עורך גליון']?.toString().trim() || '',
          publicationYear: row['שנה']?.toString().trim() || '',
          publicationPeriod: row['חודש']?.toString().trim() || '',
          articlesCatalogStatus: row['סטטוס']?.toString().trim() || 'ממתין',
          fileCompleteness: row['שלמות קובץ']?.toString().trim() || '',
          scanCompleteness: row['שלמות סריקה']?.toString().trim() || '',
          volumeSize: '',
          coverType: '',
          booklet: '',
          pdfFileName: '',
          articles: []
        };
      });

      // 2. שלב שני: מעבר על טאב המאמרים ושיוך לגליון המתאים לפי מ"ס גליון
      articlesRows.forEach((row) => {
        const volumeNum = row["מ\"ס גליון"]?.toString().trim() || row["מספר גליון"]?.toString().trim();
        if (!volumeNum) return;

        // הגנת גיבוי: אם מספר הגליון מופיע במאמרים אך לא הוגדר בטאב הגליונות, ניצור גליון ריק
        if (!seriesPayload.volumesMap[volumeNum]) {
          seriesPayload.volumesMap[volumeNum] = {
            volumeNumber: parseInt(volumeNum) || 1,
            volumeTitle: `גליון ${volumeNum} (נוצר אוטומטית)`,
            mainTopic: '', publishedFor: '', volumeEditor: '', publicationYear: '', publicationPeriod: '',
            articlesCatalogStatus: 'ממתין', fileCompleteness: '', scanCompleteness: '',
            volumeSize: '', coverType: '', booklet: '', pdfFileName: '',
            articles: []
          };
        }

        // חילוץ שם המאמר
        const articleTitle = row['כותרת המאמר']?.toString().trim() || row['כותרת']?.toString().trim() || 'ללא כותרת';
        
        // בנייה של עצם המאמר עם כל השדות הנכונים
        const articleObj = {
          contentTitle: articleTitle,
          // ❌ בלי serialNumber - השרת יוצר אותו אוטומטית!
          authors: [{
            titlePrefix: row['תואר']?.toString().trim() || '',
            firstName: row['פרטי']?.toString().trim() || '',
            lastName: row['משפחה']?.toString().trim() || '',
            role: row['תפקיד']?.toString().trim() || ''
          }],
          startPage: row["עמ'"]?.toString().trim() || row['עמוד']?.toString().trim() || '',
          section: row['מדור']?.toString().trim() || '',
          generalTopic: row['נושאים']?.toString().trim() || '',
          source: row['על מקור']?.toString().trim() || '',
          note: row['הערות']?.toString().trim() || '',
          linkedArticleId: null
        };

        // הוספת המאמר למערך המאמרים של הגליון בעל מ"ס זהה
        seriesPayload.volumesMap[volumeNum].articles.push(articleObj);
      });

      // הפיכת מפת הגליונות המאוגדת למערך חלק עבור ה-API
      const volumesArray = Object.values(seriesPayload.volumesMap).sort((a, b) => a.volumeNumber - b.volumeNumber);

      const formData = new FormData();
      formData.append('seriesData', JSON.stringify(seriesPayload.seriesData));
      formData.append('volumes', JSON.stringify(volumesArray));

      // שליחה לראוט הייבוא המשולב בשרת
      const response = await api.post('/series/save-full-catalog', formData);
      
      // הצגת הודעת הצלחה
      setPreviewMode(false);
      setFile(null);
      setExcelData(null);
      
      setTimeout(() => {
        navigate('/series');
      }, 2000);

      setError(null);
    } catch (error) {
      console.error("Error processing excel:", error);
      const errorMsg = error.response?.data?.message || "אירעה שגיאה בעיבוד הנתונים בשרת.";
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
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

  const headerSheet = excelData?.['הכותר'] || excelData?.['כותר'] || [];
  const volumesRows = excelData?.['הגליונות'] || excelData?.['גליונות'] || [];
  const articlesRows = excelData?.['המאמרים'] || excelData?.['מאמרים'] || [];

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* כותרת העמוד */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={32} />
              ייבוא משולב מאקסל לספריה
            </h1>
            <p className="text-slate-500 text-sm mt-2">העלאת סדרה חדשה עם גליונות ומאמרים בקובץ אחד</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg border shadow-sm font-bold transition-colors"
          >
            חזרה לספרייה <ArrowRight size={16} />
          </button>
        </div>

        {/* הודעת שגיאה */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">שגיאה</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* אזור גרירה והעלאת קובץ */}
        {!previewMode && (
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
                  <p className="text-slate-500 text-sm mb-6">הקובץ נטען בהצלחה ✓</p>
                  <button
                    onClick={() => { setFile(null); setExcelData(null); setPreviewMode(false); }}
                    className="text-sm font-bold text-red-500 hover:text-red-700"
                    disabled={isProcessing}
                  >
                    הסר קובץ והעלה קובץ אחר
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center cursor-pointer" onClick={() => document.getElementById('excel-upload').click()}>
                  <div className="bg-slate-100 p-4 rounded-full mb-4">
                    <UploadCloud size={48} className="text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">לחץ להעלאת קובץ אקסל או גרור לכאן</h3>
                  <p className="text-slate-500 text-sm mb-4">הקובץ חייב להכיל 3 טאבים:</p>
                  <ul className="text-slate-500 text-sm space-y-1">
                    <li>✓ <span className="font-bold">הכותר</span> - סדרה אחת בשורה אחת</li>
                    <li>✓ <span className="font-bold">הגליונות</span> - כל גליון בשורה</li>
                    <li>✓ <span className="font-bold">המאמרים</span> - כל מאמר בשורה</li>
                  </ul>
                  <input
                    type="file"
                    id="excel-upload"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* תצוגת Preview */}
        {previewMode && excelData && (
          <div className="space-y-6">
            {/* קורט הכותר */}
            {headerSheet.length > 0 && (
              <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">📌 פרטי הסדרה</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-bold text-slate-600">שם הכותר:</span>
                    <p className="text-slate-900">{headerSheet[0]['שם הכותר'] || '—'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">שם מזהה:</span>
                    <p className="text-slate-900">{headerSheet[0]['שם מזהה'] || '—'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">עורך:</span>
                    <p className="text-slate-900">{headerSheet[0]['שם העורך'] || '—'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">מקום הוצאה:</span>
                    <p className="text-slate-900">{headerSheet[0]['מקום הוצאה'] || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* סיכום נתונים */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{volumesRows.length}</div>
                <p className="text-blue-700 text-sm font-bold">גליונות</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">{articlesRows.length}</div>
                <p className="text-purple-700 text-sm font-bold">מאמרים</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-emerald-600">✓</div>
                <p className="text-emerald-700 text-sm font-bold">מוכן לייבוא</p>
              </div>
            </div>

            {/* דוגמה מגליונות */}
            {volumesRows.length > 0 && (
              <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">📚 דוגמה מהגליונות</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-right p-2">מ"ס</th>
                        <th className="text-right p-2">שם גליון</th>
                        <th className="text-right p-2">שנה</th>
                        <th className="text-right p-2">נושא ראשי</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volumesRows.slice(0, 3).map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          <td className="p-2">{row["מ\"ס"] || '—'}</td>
                          <td className="p-2">{row['שם גליון'] || '—'}</td>
                          <td className="p-2">{row['שנה'] || '—'}</td>
                          <td className="p-2">{row['נושא ראשי'] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* דוגמה ממאמרים */}
            {articlesRows.length > 0 && (
              <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">📄 דוגמה מהמאמרים</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-right p-2">כותרת</th>
                        <th className="text-right p-2">משפחה</th>
                        <th className="text-right p-2">מ"ס גליון</th>
                        <th className="text-right p-2">עמ'</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articlesRows.slice(0, 3).map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          <td className="p-2">{row['כותרת המאמר'] || '—'}</td>
                          <td className="p-2">{row['משפחה'] || '—'}</td>
                          <td className="p-2">{row['מ"ס גליון'] || '—'}</td>
                          <td className="p-2">{row["עמ'"] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* כפתורים */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => { setFile(null); setExcelData(null); setPreviewMode(false); }}
                disabled={isProcessing}
                className="bg-slate-200 hover:bg-slate-300 disabled:bg-slate-300 text-slate-800 px-8 py-3 rounded-xl font-bold text-lg shadow-md transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleProcessData}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-xl font-black text-lg shadow-md transition-colors flex items-center gap-2"
              >
                <Database size={20} />
                {isProcessing ? 'מעבד ומעלה...' : 'בצע ייבוא לספריה'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
