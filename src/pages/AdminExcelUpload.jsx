// src/components/AdminExcelUpload.jsx
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

  // פונקציה לקריאת כל הטאבים שיש בקובץ האקסל
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
        // קריאת הנתונים מהטאב הנוכחי
        allSheetsData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      });
      
      setExcelData(allSheetsData);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // עיבוד משולב השומר על הקישור בין גליונות למאמרים לפי מפתח מספר המיקבץ
  const handleProcessData = async () => {
    if (!excelData) {
      alert("לא נמצאו נתונים לעיבוד בקובץ.");
      return;
    }

    setIsProcessing(true);

    try {
      // חילוץ שם הסדרה משם הקובץ (ללא הסיומת)
      const seriesName = file?.name?.replace(/\.[^/.]+$/, "") || "סדרה תורנית חדשה";
      
      const sheetNames = Object.keys(excelData);
      
      // איתור הטאבים הנכונים באקסל (תומך גם בשמות בעברית וגם לפי מיקום הטאב)
      const volumesRows = excelData['גליונות'] || excelData['גליונות '] || excelData[sheetNames[0]] || [];
      const articlesRows = excelData['מאמרים'] || excelData['מאמרים '] || excelData[sheetNames[1]] || [];

      // יצירת מבנה הנתונים הראשי של הסדרה
      const seriesPayload = {
        seriesData: {
          title: seriesName,
          fileName: seriesName, // משמש כמזהה ייחודי לבדיקת כפילויות בשרת
          publisher: '',
          description: 'ייבוא אוטומטי משולב מאקסל',
          enteredBy: currentUser?.username || 'מנהל'
        },
        volumesMap: {}
      };

      // 1. שלב ראשון: מעבר על טאב גליונות ומיפוי לפי מספר מיקבץ
      volumesRows.forEach((row) => {
        const mixbachNumber = row["מס' מיקבץ"]?.toString().trim() || row["מספר מיקבץ"]?.toString().trim();
        if (!mixbachNumber) return;

        seriesPayload.volumesMap[mixbachNumber] = {
          volumeNumber: parseInt(mixbachNumber) || 1,
          volumeTitle: row['שם גליון']?.toString().trim() || `גליון ${mixbachNumber}`,
          mainTopic: row['נושא ראשי']?.toString().trim() || '',
          publishedFor: row['יצא לרגל']?.toString().trim() || '',
          publicationYear: row['שנה']?.toString().trim() || '',
          publicationPeriod: row['חודש']?.toString().trim() || '',
          articlesCatalogStatus: row['סטטוס גליון']?.toString().trim() || row['סטטוס']?.toString().trim() || 'ממתין',
          fileCompleteness: row['שלמות קובץ']?.toString().trim() || '',
          scanCompleteness: row['שלמות סריקה']?.toString().trim() || '',
          articles: [] // פה ירוכזו המאמרים השייכים לגליון זה
        };
      });

      // 2. שלב שני: מעבר על טאב מאמרים ושיוך לגליון המתאים לפי מספר המיקבץ
      articlesRows.forEach((row) => {
        const mixbachNumber = row["מס' מיקבץ"]?.toString().trim() || row["מספר מיקבץ"]?.toString().trim();
        if (!mixbachNumber) return;

        // הגנת גיבוי: אם מספר המיקבץ מופיע במאמרים אך לא הוגדר בלשונית הגליונות, ניצור גליון ריק כדי שהמאמר לא יילך לאיבוד
        if (!seriesPayload.volumesMap[mixbachNumber]) {
          seriesPayload.volumesMap[mixbachNumber] = {
            volumeNumber: parseInt(mixbachNumber) || 1,
            volumeTitle: `גליון ${mixbachNumber} (נוצר אוטומטית)`,
            mainTopic: '', publishedFor: '', publicationYear: '', publicationPeriod: '',
            articlesCatalogStatus: 'ממתין', fileCompleteness: '', scanCompleteness: '',
            articles: []
          };
        }

        // חילוץ שם המאמר או תוכן הכותרת
        const articleTitle = row['שם המאמר']?.toString().trim() || row['כותרת']?.toString().trim() || row['כותרת המאמר']?.toString().trim();
        
        // שליפת שאר השדות בדיוק לפי המבנה המוצג בטופס שלך
        const articleObj = {
          title: articleTitle || '',
          contentTitle: articleTitle || 'ללא כותרת',
          author: row['מחבר']?.toString().trim() || `${row['שם פרטי']?.toString().trim() || ''} ${row['שם משפחה']?.toString().trim() || ''}`.trim(),
          source: row['מקור']?.toString().trim() || '',
          section: row['מדור']?.toString().trim() || '',
          generalTopic: row['נושא']?.toString().trim() || row['נושא כללי']?.toString().trim() || '',
          page: row["עמ'"]?.toString().trim() || row["עמ' "]?.toString().trim() || row['עמוד']?.toString().trim() || '',
          note: row['הערות']?.toString().trim() || '',
          linkExplanation: row['קישור']?.toString().trim() || row['הסבר קישור']?.toString().trim() || '',
          // שדות נוספים המופיעים בטבלה שלך:
          authors: [{
            titlePrefix: row['תואר']?.toString().trim() || '',
            firstName: row['שם פרטי']?.toString().trim() || '',
            lastName: row['שם משפחה']?.toString().trim() || '',
            role: row['תפקיד']?.toString().trim() || ''
          }]
        };

        // הוספת המאמר למערך המאמרים של הגליון בעל מספר המיקבץ הזהה
        seriesPayload.volumesMap[mixbachNumber].articles.push(articleObj);
      });

      // הפיכת מפת הגליונות המאוגדת למערך חלק עבור ה-API
      const volumesArray = Object.values(seriesPayload.volumesMap);

      const formData = new FormData();
      formData.append('seriesData', JSON.stringify(seriesPayload.seriesData));
      formData.append('volumes', JSON.stringify(volumesArray));

      // שליחה לראוט הייבוא המשולב בשרת
      await api.post('/series/save-full-catalog', formData);

      alert('כל הנתונים מהאקסל עובדו, שולבו וקושרו בהצלחה למערכת הקטלוג!');
      navigate('/series');

    } catch (error) {
      console.error("Error processing full excel:", error);
      alert(error.response?.data?.message || "אירעה שגיאה בעיבוד וקישור הנתונים בשרת. ודא שמבנה הטאבים תקין.");
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

        {/* כותרת העמוד */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={28} />
              ייבוא משולב מאקסל לספריה
            </h1>
            <p className="text-slate-500 text-sm mt-1">סריקה, זיהוי כפילויות סדרות וקישור אוטומטי של מאמרים לגליונות לפי מספר מיקבץ</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg border shadow-sm font-bold transition-colors"
          >
            חזרה לספרייה <ArrowRight size={16} />
          </button>
        </div>

        {/* אזור גרירה והעלאת קובץ */}
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
                <p className="text-slate-500 text-sm mb-2">הקובץ נטען בהצלחה ומכיל {Object.keys(excelData || {}).length} לשוניות (טאבים)</p>
                <p className="text-slate-400 text-xs mb-6">(זוהו {totalRowsCount} שורות נתונים לעיבוד משותף)</p>
                <button
                  onClick={() => { setFile(null); setExcelData(null); }}
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
                <h3 className="text-lg font-bold text-slate-800 mb-1">לחץ להעלאת קובץ האקסל המלא או גרור לכאן</h3>
                <p className="text-slate-500 text-sm mb-4">הקוד יקרא את הלשוניות "גליונות" ו"מאמרים" ויקשר ביניהן אוטומטית</p>
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

          {/* כפתור עיבוד ושליחה */}
          {file && (
            <div className="mt-8 border-t pt-6 flex justify-end">
              <button
                onClick={handleProcessData}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-xl font-black text-lg shadow-md transition-colors flex items-center gap-2"
              >
                <Database size={20} />
                {isProcessing ? 'מעבד ומקשר מאמרים לגליונות...' : 'בצע ייבוא משולב למערכת'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}