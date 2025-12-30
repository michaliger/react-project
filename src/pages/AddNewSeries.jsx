import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Users, Save, X, Upload, EyeOff } from 'lucide-react'

const Field = ({ label, children, colSpan = '' }) => (
  <div className={`flex flex-col gap-1.5 ${colSpan}`}>
    <label className="text-sm font-bold text-slate-700 mr-1">{label}</label>
    {children}
  </div>
)

export default function AddNewSeries() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [activeVolume, setActiveVolume] = useState(0)
  const [series, setSeries] = useState({
    prefixName: '', fileName: '', identifierName: '', details: '',
    editor: '', publicationPlace: '', publicationYears: [],
    sector: '', missingVolumesList: '', userNotes: '', adminNotes: '',
    fileDescription: '', coverImage: null, coverPreview: null,
    createdBy: "691f8b89e60ae71b1932aab0",
    enteredBy: '', catalogStatus: ''
  })

  const createEmptyVolume = (index) => ({
    id: Math.random().toString(36).substr(2, 9),
    volumeTitle: '', volumeNumber: (index + 1).toString(),
    booklet: '', showOptionalFields: false,
    mainTopic: '', publishedFor: '', publicationYear: '',
    StartYear: '', publicationPeriod: '', coverType: '', volumeSize: '',
    articlesCount: 0, fileCompleteness: '', scanCompleteness: '',
    articlesCatalogStatus: '', articlesTopicsSourcesStatus: '',
    articles: [{
      id: Math.random().toString(36).substr(2, 9),
      autoId: 1,
      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
      additionalAuthors: [],
      page: '', title: '', generalTopic: '', source: '', linkedArticleId: '', linkType: ''
    }]
  })

  const [volumes, setVolumes] = useState([createEmptyVolume(0)])

  useEffect(() => {
    setSeries(prev => ({ ...prev, totalVolumes: volumes.length }))
  }, [volumes.length])

  useEffect(() => {
    const years = volumes.map(v => v.publicationYear).filter(y => y && y !== 'לא ידוע')
    setSeries(prev => ({ ...prev, publicationYears: years }))
  }, [volumes])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) setSeries(prev => ({ ...prev, coverImage: file, coverPreview: URL.createObjectURL(file) }))
  }

  const updateSeries = (field, value) => setSeries(prev => ({ ...prev, [field]: value }))

  const addVolume = () => {
    const newVol = createEmptyVolume(volumes.length)
    setVolumes([...volumes, newVol])
    setActiveVolume(volumes.length)
  }

  const removeVolume = (idx) => {
    if (volumes.length <= 1) return
    setVolumes(volumes.filter((_, i) => i !== idx))
    setActiveVolume(Math.max(0, idx - 1))
  }

  const updateVolumeField = (vIdx, field, value) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx][field] = value
    setVolumes(newVolumes)
  }

  const updateArticle = (vIdx, aIdx, field, value) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx].articles[aIdx][field] = value
    setVolumes(newVolumes)
  }

  const updateArticleAuthor = (vIdx, aIdx, authorIndex, subField, value) => {
    const newVolumes = [...volumes]
    if (authorIndex === 0) {
      newVolumes[vIdx].articles[aIdx].authors[0][subField] = value
    } else {
      newVolumes[vIdx].articles[aIdx].additionalAuthors[authorIndex - 1][subField] = value
    }
    setVolumes(newVolumes)
  }

  const addArticle = (vIdx) => {
    const newVolumes = [...volumes]
    const newArt = {
      id: Math.random().toString(36).substr(2, 9),
      autoId: newVolumes[vIdx].articles.length + 1,
      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
      additionalAuthors: [],
      page: '', title: '', generalTopic: '', source: '', linkedArticleId: '', linkType: ''
    }
    newVolumes[vIdx].articles.push(newArt)
    setVolumes(newVolumes)
  }

  const removeArticle = (vIdx, aIdx) => {
    const newVolumes = [...volumes]
    if (newVolumes[vIdx].articles.length <= 1) return
    newVolumes[vIdx].articles = newVolumes[vIdx].articles.filter((_, i) => i !== aIdx)
    newVolumes[vIdx].articles.forEach((art, i) => art.autoId = i + 1)
    setVolumes(newVolumes)
  }

  const addAdditionalAuthor = (vIdx, aIdx) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx].articles[aIdx].additionalAuthors.push({
      titlePrefix: '', firstName: '', lastName: '', role: ''
    })
    setVolumes(newVolumes)
  }

  const removeAdditionalAuthor = (vIdx, aIdx, addIdx) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx].articles[aIdx].additionalAuthors.splice(addIdx, 1)
    setVolumes(newVolumes)
  }

  const currentVolume = volumes[activeVolume] || { articles: [] }

  const USER_ID = "691f8b89e60ae71b1932aab0";  // ה-ID האמיתי שלך – השתמשי באותו בכל מקום!

  const handleSave = async () => {
    if (!series.fileName.trim()) {
      alert('שם הקובץ הוא חובה!');
      return;
    }

    let seriesId = null;

    try {
      // שלב 1: שמירת הסדרה
      const seriesData = {
        prefixName: series.prefixName?.trim() || '',
        fileName: series.fileName.trim(),
        identifierName: series.identifierName?.trim() || '',
        details: series.details?.trim() || '',
        editor: series.editor?.trim() || '',
        publicationPlace: series.publicationPlace?.trim() || '',
        sector: series.sector?.trim() || '',
        catalogStatus: series.catalogStatus?.trim() || 'חדש',
        fileDescription: series.fileDescription?.trim() || '',
        userNotes: series.userNotes?.trim() || '',
        missingVolumesList: series.missingVolumesList?.trim() || '',
        createdBy: USER_ID
      };

      console.log('שולח סדרה:', seriesData);

      const seriesRes = await fetch('http://localhost:5000/api/series/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seriesData)
      });

      if (!seriesRes.ok) {
        const text = await seriesRes.text();
        console.error('שגיאה בסדרה:', text);
        throw new Error(`לא נשמרה הסדרה: ${text.substring(0, 200)}`);
      }

      const seriesJson = await seriesRes.json();
      seriesId = seriesJson._id || "691f8b89e60ae71b1932aab0";

      if (!seriesId) throw new Error('לא התקבל ID של הסדרה');

      console.log('סדרה נשמרה! ID:', seriesId);

      // שלב 2: שמירת כל הכרכים והמאמרים
      for (const vol of volumes) {
        const volumeData = {
          title: vol.volumeTitle || '',
          volumeNumber: vol.volumeNumber ? parseInt(vol.volumeNumber) : null,
          publicationYear: vol.publicationYear || null,
          publicationPeriod: vol.publicationPeriod || null,
          publishedFor: vol.publishedFor || null,
          mainTopic: vol.mainTopic || null,
          volumeSize: series.volumeSize || '',
          coverType: series.coverType || '',
          articlesCatalogStatus: vol.articlesCatalogStatus || '',
          articlesTopicsSourcesStatus: vol.articlesTopicsSourcesStatus || '',
          series: seriesId,
          createdBy: USER_ID
          // **אל תוסיפי fileName בכלל!**
        };

        console.log('שולח כרך:', volumeData);

        const volRes = await fetch('http://localhost:5000/api/volumes/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(volumeData)
        });

        if (!volRes.ok) {
          const text = await volRes.text();
          console.error('שגיאה בכרך:', text);
          throw new Error(`שגיאה בשמירת כרך: ${text.substring(0, 200)}`);
        }

        const volJson = await volRes.json();
        const volumeId = volJson._id;

        // שמירת מאמרים
        const subtitles = vol.articles.map((art, index) => ({
          serialNumber: String(index + 1).padStart(3, '0'),
          contentTitle: art.title?.trim() || 'ללא כותרת',
          source: art.source?.trim() || null,
          startPage: art.page ? parseInt(art.page) : null,
          generalTopic: art.generalTopic?.trim() || '',
          linkedArticleId: art.linkType?.trim() || '',
          authors: [
            {
              titlePrefix: art.authors[0]?.titlePrefix?.trim() || '',
              firstName: art.authors[0]?.firstName?.trim() || '',
              lastName: art.authors[0]?.lastName?.trim() || '',
              role: art.authors[0]?.role?.trim() || 'מחבר'
            },
            ...(art.additionalAuthors || []).map(a => ({
              titlePrefix: a.titlePrefix?.trim() || '',
              firstName: a.firstName?.trim() || '',
              lastName: a.lastName?.trim() || '',
              role: a.role?.trim() || 'מחבר'
            }))
          ],
          createdBy: USER_ID
        }));

        for (const sub of subtitles) {
          const subRes = await fetch('http://localhost:5000/api/subtitles/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
          });

          if (!subRes.ok) {
            const text = await subRes.text();
            throw new Error(`שגיאה במאמר: ${text.substring(0, 200)}`);
          }

          const subJson = await subRes.json();

          await fetch(`http://localhost:5000/api/volumes/${volumeId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ $push: { subtitles: subJson._id } })
          });
        }
      }

      alert('הכל נשמר בהצלחה! 🎉');
      navigate('/series-list');

    } catch (err) {
      console.error('שגיאה כללית:', err);
      alert('שגיאה: ' + err.message);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-right text-slate-900" dir="rtl">
      <div className="max-w-[1650px] mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-800">הוספת קובץ חדש</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-5 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50">ביטול</button>
            <button
              onClick={handleSave}
              className="px-7 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg"
            >
              <Save size={18} /> שמור הכל
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6 min-h-[600px] mt-10">
          <div className="col-span-12 lg:col-span-6 space-y-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
              <div className="grid grid-cols-6 gap-4">
                <Field label="שם מקדים" colSpan="col-span-1">
                  <select value={series.prefixName || ''} onChange={e => updateSeries('prefixName', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                    <option value=""></option>
                    <option value="ספר זכרון">ספר זכרון</option>
                    <option value="קובץ זכרון">קובץ זכרון</option>
                    <option value="קובץ תורני">קובץ תורני</option>
                    <option value="קובץ">קובץ</option>
                    <option value="ספר">ספר</option>
                    <option value="ירחון">ירחון</option>
                    <option value="בטאון">בטאון</option>
                  </select>
                </Field>
                <Field label="שם הקובץ (חובה)" colSpan="col-span-2">
                  <input value={series.fileName || ''} required onChange={e => updateSeries('fileName', e.target.value)} className="p-2 bg-white border-2 border-indigo-100 rounded-lg font-bold text-slate-900" />
                </Field>
                <Field label="שם מזהה (לכפילויות בלבד)" colSpan="col-span-3">
                  <input value={series.identifierName || ''} onChange={e => updateSeries('identifierName', e.target.value)} placeholder="רק אם יש שם זהה לסדרה אחרת" className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>

                <Field label="פרטים" colSpan="col-span-3">
                  <input value={series.details || ''} required onChange={e => updateSeries('details', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="עורך" colSpan="col-span-2">
                  <input value={series.editor || ''} onChange={e => updateSeries('editor', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="מגזר" colSpan="col-span-1">
                  <select value={series.sector || ''} onChange={e => updateSeries('sector', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                    <option value=""></option>
                    <option value="לטאי">לטאי</option>
                    <option value="ספרדי">ספרדי</option>
                    <option value="דתי">דתי</option>
                    <option value="חסידי">חסידי</option>
                  </select>
                </Field>
                <Field label="מקום הוצאה" colSpan="col-span-1">
                  <input value={series.publicationPlace || ''} required onChange={e => updateSeries('publicationPlace', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="נכנס לאוסף על ידי" colSpan="col-span-2">
                  <input value={series.enteredBy || ''} onChange={e => updateSeries('enteredBy', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>

                <Field label="שנות הוצאה" colSpan="col-span-1">
                  <input value={series.publicationYears.join(', ') || ''} readOnly className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700" />
                </Field>
                <Field label="סה''כ גליונות" colSpan="col-span-1">
                  <input type="number" value={series.totalVolumes || 0} readOnly className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="סטטוס קטלוג" colSpan="col-span-1">
                  <input value={series.catalogStatus || ''} required onChange={e => updateSeries('catalogStatus', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>

                <div className="col-span-4 flex flex-col gap-3">
                  <Field label="תיאור הקובץ">
                    <textarea rows="1" value={series.fileDescription || ''} onChange={e => updateSeries('fileDescription', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm" />
                  </Field>
                  <Field label="הערות">
                    <textarea rows="2" value={series.userNotes || ''} onChange={e => updateSeries('userNotes', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm w-full" />
                  </Field>
                  <Field label="רשימת כרכים חסרים">
                    <textarea rows="2" value={series.missingVolumesList || ''} onChange={e => updateSeries('missingVolumesList', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm w-full" />
                  </Field>
                </div>

                <div className="col-span-2">
                  <div onClick={() => fileInputRef.current.click()} className="w-full max-w-[260px] h-96 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all overflow-hidden relative bg-slate-50">
                    {series.coverPreview ? <img src={series.coverPreview} alt="Preview" className="h-full w-auto object-contain p-2" /> : <Upload size={48} className="text-slate-300" />}
                  </div>
                  <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 space-y-6 flex flex-col">
            <div className="flex flex-wrap items-center gap-3 pb-4 -mx-1">
              {volumes.map((v, i) => (
                <button key={v.id} onClick={() => setActiveVolume(i)} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 flex-shrink-0 ${activeVolume === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                  גליון {v.volumeTitle || i + 1}
                  {activeVolume === i && volumes.length > 1 && <X size={14} onClick={(e) => { e.stopPropagation(); removeVolume(i); }} />}
                </button>
              ))}
              <button onClick={addVolume} className="p-2.5 bg-white text-indigo-600 rounded-xl border-2 border-dashed border-indigo-200 hover:bg-indigo-50 shadow-sm">
                <Plus size={20} />
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-slate-50/50 p-4 rounded-2xl">
                <Field label="שם גליון" colSpan="md:col-span-3">
                  <input value={currentVolume.volumeTitle || ''} onChange={e => updateVolumeField(activeVolume, 'volumeTitle', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="יצא לאור לרגל" colSpan="md:col-span-3">
                  <input value={currentVolume.publishedFor || ''} onChange={e => updateVolumeField(activeVolume, 'publishedFor', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg w-full text-slate-900 font-semibold" />
                </Field>
                <Field label="חודש/תקופה" colSpan="md:col-span-2">
                  <input value={currentVolume.publicationPeriod || ''} onChange={e => updateVolumeField(activeVolume, 'publicationPeriod', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="שנה" colSpan="md:col-span-2">
                  <input value={currentVolume.publicationYear || ''} required onChange={e => updateVolumeField(activeVolume, 'publicationYear', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="סוג כריכה" colSpan="md:col-span-2">
                  <select value={series.coverType || ''} onChange={e => updateSeries('coverType', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                    <option value=""></option>
                    <option value="קשה">קשה</option>
                    <option value="רכה">רכה</option>
                  </select>
                </Field>
                <Field label="גודל גליון" colSpan="md:col-span-2">
                  <select value={series.volumeSize || ''} onChange={e => updateSeries('volumeSize', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                    <option value=""></option>
                    <option value="גדול">גדול</option>
                    <option value="קטן">קטן</option>
                    <option value="בינוני">בינוני</option>
                  </select>
                </Field>

                <Field label="נושא ראשי" colSpan="md:col-span-2">
                  <input value={currentVolume.mainTopic || ''} onChange={e => updateVolumeField(activeVolume, 'mainTopic', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold" />
                </Field>
                <Field label="סטטוס קטלוג" colSpan="md:col-span-2">
                  <input value={currentVolume.articlesCatalogStatus || ''} onChange={e => updateVolumeField(activeVolume, 'articlesCatalogStatus', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs" />
                </Field>
                <Field label="סטטוס מקורות" colSpan="md:col-span-2">
                  <input value={currentVolume.articlesTopicsSourcesStatus || ''} onChange={e => updateVolumeField(activeVolume, 'articlesTopicsSourcesStatus', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs" />
                </Field>

                {currentVolume.showOptionalFields ? (
                  <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-6 gap-4 mt-4 bg-indigo-50/30 p-4 rounded-xl">
                    <Field label="מספר גליון" colSpan="md:col-span-2">
                      <input value={currentVolume.volumeNumber || ''} onChange={e => updateVolumeField(activeVolume, 'volumeNumber', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold w-full" />
                    </Field>
                    <Field label="שנה" colSpan="md:col-span-2">
                      <input value={currentVolume.StartYear || ''} onChange={e => updateVolumeField(activeVolume, 'StartYear', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 w-full" />
                    </Field>
                    <Field label="חוברת" colSpan="md:col-span-1">
                      <input value={currentVolume.booklet || ''} onChange={e => updateVolumeField(activeVolume, 'booklet', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 w-full" />
                    </Field>
                    <div className="md:col-span-1 flex items-end">
                      <button type="button" onClick={() => updateVolumeField(activeVolume, 'showOptionalFields', false)} className="w-full py-2 px-3 bg-red-100 text-red-600 rounded-lg font-semibold flex items-center justify-center gap-1 hover:bg-red-200 transition-colors text-sm">
                        <EyeOff size={16} /> הסתר
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-1 flex items-end pb-2">
                    <button type="button" onClick={() => updateVolumeField(activeVolume, 'showOptionalFields', true)} className="w-full py-1.5 px-3 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-indigo-200 transition-colors border border-indigo-300">
                      <Plus size={14} /> פרטים נוספים
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6 mt-0">
          <div className="space-y-4 mt-0">
            <h4 className="font-black text-slate-800 border-r-4 border-indigo-500 pr-3">מאמרים בגליון</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full table-auto text-right border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-black text-[11px] font-black">
                    <th className="p-3 w-12 text-center">מס'</th>
                    <th className="p-3 border-l border-slate-700 w-12">תואר</th>
                    <th className="p-3 border-l border-slate-700 w-36"> פרטי</th>
                    <th className="p-3 border-l border-slate-700 w-28"> משפחה</th>
                    <th className="p-3 border-l border-slate-700 w-48">תפקיד</th>
                    <th className="p-3 border-l border-slate-700 w-96"> המאמר</th>
                    <th className="p-3 border-l border-slate-700 w-12">עמוד</th>
                    <th className="p-3 border-l border-slate-700 w-24">נושא</th>
                    <th className="p-3 border-l border-slate-700">מקור</th>
                    <th className="p-3 border-l border-slate-700 w-20">ID קשר</th>
                    <th className="p-3 border-l border-slate-700 w-12">הקשר</th>
                    <th className="p-3 w-20 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-900">
                  {(currentVolume.articles || []).map((art, aIdx) => (
                    <tr key={art.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                      <td className="p-2 text-center font-bold text-slate-600 bg-slate-50/50 border-l border-slate-100">{art.autoId}</td>
                      <td className="p-1"><input value={art.authors[0]?.titlePrefix || ''} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'titlePrefix', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                      <td className="p-1"><input value={art.authors[0]?.firstName || ''} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'firstName', e.target.value)} className="w-full p-2 bg-transparent border-none font-bold text-slate-900" /></td>
                      <td className="p-1"><input value={art.authors[0]?.lastName || ''} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'lastName', e.target.value)} className="w-full p-2 bg-transparent border-none font-bold text-slate-900" /></td>
                      <td className="p-1"><input value={art.authors[0]?.role || ''} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'role', e.target.value)} className="w-full p-2 bg-transparent border-none italic text-slate-600" /></td>
                      <td className="p-1"><input value={art.page || ''} onChange={e => updateArticle(activeVolume, aIdx, 'page', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                      <td className="p-1"><input value={art.title || ''} onChange={e => updateArticle(activeVolume, aIdx, 'title', e.target.value)} className="w-full p-2 bg-transparent border-none font-black text-indigo-900" /></td>
                      <td className="p-1"><input value={art.generalTopic || ''} onChange={e => updateArticle(activeVolume, aIdx, 'generalTopic', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                      <td className="p-1"><input value={art.source || ''} onChange={e => updateArticle(activeVolume, aIdx, 'source', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                      <td className="p-1"><input value={art.linkedArticleId || ''} onChange={e => updateArticle(activeVolume, aIdx, 'linkedArticleId', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                      <td className="p-1">
                        <select value={art.linkType || ''} onChange={e => updateArticle(activeVolume, aIdx, 'linkType', e.target.value)} className="w-full bg-transparent border-none text-slate-900 text-xs">
                          <option value=""></option>
                          <option value="המשך">המשך</option>
                          <option value="ביקורת">ביקורת</option>
                          <option value="תגובה">תגובה</option>
                        </select>
                      </td>
                      <td className="p-1 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => addAdditionalAuthor(activeVolume, aIdx)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg" title="הוסף מחבר נוסף">
                            <Users size={16} />
                          </button>
                          <button onClick={() => removeArticle(activeVolume, aIdx)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {(currentVolume.articles || []).map((art, aIdx) =>
                (art.additionalAuthors || []).map((author, addIdx) => (
                  <div key={`${art.id}-${addIdx}`} className="flex items-center gap-2 bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                    <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-1 rounded">מאמר {art.autoId}</span>
                    <input placeholder="תואר" value={author.titlePrefix || ''} onChange={e => updateArticleAuthor(activeVolume, aIdx, addIdx + 1, 'titlePrefix', e.target.value)} className="w-20 px-2 py-1 text-sm border border-slate-300 rounded" />
                    <input placeholder="שם פרטי" value={author.firstName || ''} onChange={e => updateArticleAuthor(activeVolume, aIdx, addIdx + 1, 'firstName', e.target.value)} className="w-28 px-2 py-1 text-sm border border-slate-300 rounded font-bold" />
                    <input placeholder="שם משפחה" value={author.lastName || ''} onChange={e => updateArticleAuthor(activeVolume, aIdx, addIdx + 1, 'lastName', e.target.value)} className="w-28 px-2 py-1 text-sm border border-slate-300 rounded font-bold" />
                    <input placeholder="תפקיד" value={author.role || ''} onChange={e => updateArticleAuthor(activeVolume, aIdx, addIdx + 1, 'role', e.target.value)} className="w-24 px-2 py-1 text-sm border border-slate-300 rounded italic" />
                    <button onClick={() => removeAdditionalAuthor(activeVolume, aIdx, addIdx)} className="text-red-600 hover:bg-red-100 rounded-full p-1">
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => addArticle(activeVolume)} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2 transition-all">
              <Plus size={20} /> הוסף שורת מאמר חדשה
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}