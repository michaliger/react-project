import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UploadCloud, FileSpreadsheet, ArrowRight, AlertTriangle, CheckCircle2, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api'; 

export default function AdminExcelUpload() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  // בדיקת הרשאות מנהל
  const isAdmin = currentUser && currentUser.role === 'admin';

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [excelData, setExcelData] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);

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

  // פונקציה לקריאת כל הטאבים (העמודים) שיש בקובץ האקסל
  const handleFileUpload = (uploadedFile) => {
    if (!uploadedFile) return;
    
    if (!uploadedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      alert('נא להעלות קובץ אקסל תקין (.xlsx, .xls)');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      
      const allSheetsData = {};
      
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        allSheetsData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      });
      
      setExcelData(allSheetsData);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // עיבוד משולב השומר על המספר הסידורי של המקבץ לצורך קישור מדויק
  const handleProcessData = async () => {
    if (!excelData) {
      alert("לא נמצאו נתונים לעיבוד בקובץ.");
      return;
    }

    setIsProcessing(true);

    try {
      const fileName = file?.name?.replace(/\.[^/.]+$/, "") || "קול התורה";
      
      const sheetNames = Object.keys(excelData);
      const volumesRows = excelData['גליונות'] || excelData[sheetNames[0]] || [];
      const articlesRows = excelData['מאמרים'] || excelData[sheetNames[1]] || [];

      const seriesPayload = {
        seriesData: {
          prefixName: '',
          fileName: fileName,
          identifierName: fileName,
          details: 'ייבוא משולב מאקסל',
          editor: '',
          publicationPlace: '',
          sector: '',
          catalogStatus: 'טיוטה',
          missingVolumesList: '',
          adminNotes: '',
          enteredBy: currentUser?.username || 'מנהל'
        },
        volumesMap: {}
      };

      // 1. שלב ראשון: מיפוי הגליונות וקביעת מזהה קבוע לפי מספר המיקבץ
      volumesRows.forEach((row) => {
        const mixbachNumber = row["מס' מיקבץ"]?.toString().trim();
        if (!mixbachNumber) return;

        seriesPayload.volumesMap[mixbachNumber] = {
          id: `vol-${mixbachNumber}`, // מזהה קבוע ולא אקראי מונע כפילויות
          volumeNumber: mixbachNumber, // המספר הסידורי לפיו המאמרים יתקשרו
          volumeTitle: row['שם גליון']?.toString().trim() || `מקבץ ${mixbachNumber}`,
          mainTopic: row['נושא ראשי']?.toString().trim() || '',
          publishedFor: row['יצא לרגל']?.toString().trim() || '',
          publicationYear: row['שנה']?.toString().trim() || '',
          publicationPeriod: row['חודש']?.toString().trim() || '',
          articlesCatalogStatus: row['סטטוס גליון']?.toString().trim() || 'ממתין',
          fileCompleteness: row['שלמות קובץ']?.toString().trim() || '',
          scanCompleteness: row['שלמות סריקה']?.toString().trim() || '',
          pdfFileName: '',
          articles: []
        };
      });

      // 2. שלב שני: קריאת המאמרים ושיוכם הישיר לגליון התואם לפי מפתח מספר המיקבץ
      articlesRows.forEach((row) => {
        const mixbachNumber = row["מס' מיקבץ"]?.toString().trim();
        if (!mixbachNumber) return;

        // הגנת גיבוי: אם המקבץ לא נמצא בלשונית הגליונות, ניצור אותו כדי שהמאמר לא ייזרק
        if (!seriesPayload.volumesMap[mixbachNumber]) {
          seriesPayload.volumesMap[mixbachNumber] = {
            id: `vol-${mixbachNumber}`,
            volumeNumber: mixbachNumber,
            volumeTitle: `גליון / מקבץ ${mixbachNumber}`,
            mainTopic: '', publishedFor: '', publicationYear: '', publicationPeriod: '',
            articlesCatalogStatus: 'ממתין', fileCompleteness: '', scanCompleteness: '',
            pdfFileName: '', articles: []
          };
        }

        const articleTitle = row['שם המאמר']?.toString().trim();
        if (articleTitle) {
          const articleObj = {
            id: Math.random().toString(36).substr(2, 9),
            autoId: seriesPayload.volumesMap[mixbachNumber].articles.length + 1,
            authors: [{
              titlePrefix: row['תואר לפי המקבץ']?.toString().trim() || '',
              firstName: row['שם פרטי']?.toString().trim() || '',
              lastName: row['שם משפחה']?.toString().trim() || '',
              role: row['תפקיד']?.toString().trim() || ''
            }],
            section: row['מדור']?.toString().trim() || '',
            title: articleTitle,
            source: row['מקור']?.toString().trim() || '',
            generalTopic: '',
            page: row["עמ' "]?.toString().trim() || row["עמ'"]?.toString().trim() || '',
            linkedArticleId: '',
            linkExplanation: row['הערות']?.toString().trim() || ''
          };

          // הכנסה ישירה לתוך מערך המאמרים של הגליון בעל המספר הסידורי המתאים
          seriesPayload.volumesMap[mixbachNumber].articles.push(articleObj);
        }
      });

      // 3. הפיכת מפת הגליונות המאוחדת למערך רגיל לצורך שליחה לשרת
      const volumesArray = Object.values(seriesPayload.volumesMap);

      const formData = new FormData();
      formData.append('seriesData', JSON.stringify(seriesPayload.seriesData));
      formData.append('volumes', JSON.stringify(volumesArray));

      await api.post('/series/save-full-catalog', formData);

      alert('כל הנתונים שולבו בהצלחה! המאמרים קושרו ישירות לגליונות לפי מספר המיקבץ.');
      navigate('/series');

    } catch (error) {
      console.error("Error processing full excel:", error);
      alert("אירעה שגיאה בעיבוד וקישור הנתונים.");
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

  const totalRowsCount = excelData ? Object.values(excelData).reduce((acc, sheet) => acc + sheet.length, 0) : 0;

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans" dir="rtl">
      <div className="max-w-3xl mx-auto">

        {/* כותרת */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={28} />
              ייבוא משולב מאקסל
            </h1>
            <p className="text-slate-500 text-sm mt-1">סריקה וקישור אוטומטי של כל עמודי הקובץ (גליונות + מאמרים)</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg border shadow-sm font-bold transition-colors"
          >
            חזרה לספרייה <ArrowRight size={16} />
          </button>
        </div>

        {/* אזור העלאה */}
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
                <p className="text-slate-500 text-sm mb-2">הקובץ נקרא בהצלחה ומכיל {Object.keys(excelData || {}).length} עמודים פנימיים</p>
                <p className="text-slate-400 text-xs mb-6">(סך הכל זוהו {totalRowsCount} שורות נתונים)</p>
                <button
                  onClick={() => { setFile(null); setExcelData(null); }}
                  className="text-sm font-bold text-red-500 hover:text-red-700"
                  disabled={isProcessing}
                >
                  הסר קובץ והעלה מחדש
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center cursor-pointer" onClick={() => document.getElementById('excel-upload').click()}>
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <UploadCloud size={48} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">לחץ להעלאת קובץ האקסל המלא או גרור לכאן</h3>
                <p className="text-slate-500 text-sm mb-4">הקוד יקרא את כל הלשוניות בקובץ ויקשר ביניהן אוטומטית לפי מספר מיקבץ</p>
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

          {/* כפתור הפעלה ושמירה */}
          {file && (
            <div className="mt-8 border-t pt-6 flex justify-end">
              <button
                onClick={handleProcessData}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-xl font-black text-lg shadow-md transition-colors flex items-center gap-2"
              >
                <Database size={20} />
                {isProcessing ? 'מעבד ומקשר את כל הנתונים...' : 'הכנס נתונים משולבים למערכת'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}