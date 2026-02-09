# 🚀 Quick Start Guide - FoodOS Table Management

## Prerequisites
✅ All dependencies already installed
✅ Redux store configured
✅ API services set up
✅ Authentication working

---

## How to Test

### 1. **Start the Development Server**
```bash
cd "d:\SGP 4\Code\FoodOs-Frontend"
npm run dev
```

### 2. **Login to the Application**
- Navigate to `http://localhost:5173/login`
- Login with your credentials
- System will:
  - ✅ Check if you have restaurants
  - ✅ Redirect to `/create-restaurant` if none exist
  - ✅ Redirect to `/app` if restaurants exist

### 3. **Access Table Management**
Once logged in, navigate to:
- **URL:** `/app/tables` or
- **Sidebar:** Click "Tables" or "Floor Plan"

---

## 🎯 Quick Test Scenarios

### **Scenario 1: Create Your First Table**
1. Click **"Add Table"** button
2. Fill in:
   - Table Number: `T1`
   - Section: `Main Hall`
   - Capacity: `4`
   - Min Capacity: `1`
   - Shape: `RECTANGLE`
3. Click **"Create Table"**
4. ✅ Should see table appear in grid

### **Scenario 2: Update Table Status**
1. Click on any table card
2. Status modal opens
3. Change status to **"OCCUPIED"**
4. Enter guest count: `3`
5. Click **"Update Status"**
6. ✅ Table color changes to yellow
7. ✅ Guest count displays on card

### **Scenario 3: Merge Tables** (Large Party)
1. Create 3 tables (T1, T2, T3) - all VACANT
2. Click **"Merge"** button in toolbar
3. Select T1 as Parent
4. Check T2 and T3 as children
5. Click **"Merge Tables"**
6. ✅ Tables now linked

### **Scenario 4: Transfer Order**
1. Have one OCCUPIED table (T1)
2. Have one VACANT table (T2)
3. Click **"Transfer"** button
4. Select T1 as source
5. Select T2 as destination
6. Click **"Transfer Order"**
7. ✅ Guests moved to T2
8. ✅ T1 becomes VACANT

---

## 🐛 Troubleshooting

### **Issue: "No tables found"**
**Cause:** Restaurant has no tables yet  
**Solution:** Click "Add Table" to create your first table

### **Issue: Redux state not updating**
**Cause:** Store not properly configured  
**Solution:** Already fixed in `store.js` - tables reducer added

### **Issue: API calls failing (401)**
**Cause:** Token expired  
**Solution:** Automatic refresh token rotation handles this

### **Issue: Modal won't close**
**Cause:** Click outside modal or press ESC  
**Solution:** Built-in modal close handlers

---

## 📊 Expected API Responses

### **GET `/api/v1/tables/restaurant/{uuid}`**
```json
[
  {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "tableNumber": "T12",
    "sectionName": "AC Hall",
    "capacity": 6,
    "minCapacity": 2,
    "shape": "RECTANGLE",
    "status": "VACANT",
    "posX": 420,
    "posY": 180,
    "isActive": true,
    "currentPax": 0,
    "currentOrderId": null,
    "waiterUuid": null,
    "lastUpdated": "2026-02-07T10:30:00Z"
  }
]
```

### **POST `/api/v1/tables`** (Create)
**Request:**
```json
{
  "restaurantUuid": "660e8400-e29b-41d4-a716-446655440000",
  "sectionName": "VIP Area",
  "tableNumber": "T12",
  "capacity": 6,
  "minCapacity": 2,
  "shape": "RECTANGLE",
  "posX": 420,
  "posY": 180,
  "isActive": true
}
```

**Response:** 201 Created + table object

### **PATCH `/api/v1/tables/{uuid}/status`** (Update Status)
**Request:**
```json
{
  "status": "OCCUPIED",
  "currentOrderId": "550e8400-e29b-41d4-a716-446655440000",
  "waiterUuid": "880e8400-e29b-41d4-a716-446655440000",
  "currentPax": 4
}
```

**Response:** 200 OK + updated table

---

## 🔍 Testing Checklist

### **Basic Operations:**
- [ ] Create table → Table appears in grid
- [ ] Edit table → Changes saved
- [ ] Delete table → Confirmation dialog → Table removed
- [ ] Change status → Color updates
- [ ] Filter by status → Only matching tables shown
- [ ] Filter by section → Only matching section shown

### **Advanced Operations:**
- [ ] Merge 2 tables → Success message
- [ ] Transfer order → Source becomes VACANT, destination OCCUPIED
- [ ] View analytics → Modal shows stats

### **Edge Cases:**
- [ ] Try to merge OCCUPIED tables → Error (should only allow VACANT)
- [ ] Try to transfer from VACANT table → Not in dropdown
- [ ] Delete table with active order → Confirmation required
- [ ] Create table with duplicate number → Backend handles validation

### **UI/UX:**
- [ ] Loading spinner shows during API calls
- [ ] Error messages display and auto-dismiss
- [ ] Modals close on ESC key
- [ ] Forms validate required fields
- [ ] Disabled states prevent double-submission

---

## 🎨 Visual Testing

### **Status Colors:**
- VACANT = White/Light Gray ✅
- OCCUPIED = Yellow ✅
- BILLED = Green ✅
- DIRTY = Red ✅
- RESERVED = Blue ✅

### **Responsive Design:**
- Mobile (< 768px): 2 columns ✅
- Tablet (768-1280px): 3 columns ✅
- Desktop (> 1280px): 4 columns ✅
- Sidebar hides on mobile (< 1024px) ✅

---

## 💻 Development Tips

### **Redux DevTools:**
1. Install Redux DevTools browser extension
2. Open DevTools (F12)
3. Select "Redux" tab
4. Monitor all actions and state changes in real-time

### **Hot Module Replacement:**
- Edit any file
- Changes reflect instantly (no page reload)
- Redux state persists during HMR

### **Console Logging:**
All errors are logged with context:
```javascript
console.error('Failed to create table:', err);
```

---

## 📱 Mobile Testing

### **Recommended:**
1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device (iPhone 12, iPad, etc.)
4. Test touch interactions
5. Verify 2-column grid on mobile

---

## 🔐 Authentication Flow

### **First Time User:**
```
Login → No Restaurants → Redirect /create-restaurant
  ↓
Create Restaurant → Token Updated → Redirect /app
  ↓
Access Table Management (/app/tables)
```

### **Existing User:**
```
Login → Has Restaurants → Redirect /app
  ↓
Select Active Restaurant (if multiple)
  ↓
Access Table Management (/app/tables)
  ↓
Tables Load Automatically
```

---

## 🚀 Performance Tips

### **Large Restaurant (100+ tables):**
- Use pagination: `getAllTables({ page, size })`
- Filter on server-side: `getAllTables({ status: 'OCCUPIED' })`
- Optimize grid rendering with virtual scrolling (future enhancement)

### **Real-time Updates:**
- Current: Manual refresh
- Future: WebSocket integration for live sync

---

## 📞 Common Questions

### **Q: Can I have multiple sections?**
**A:** Yes! Each table has a `sectionName` field. The UI auto-generates section tabs.

### **Q: What happens if I refresh the page?**
**A:** Redux state is cleared, but tables reload automatically via `useEffect`.

### **Q: Can I customize table shapes?**
**A:** Yes! Shape is stored as `RECTANGLE`, `ROUND`, `SQUARE`, `OVAL`. Add more in backend enum.

### **Q: How do I handle split bills?**
**A:** Future enhancement - bill splitting logic goes in OrderEntry module.

### **Q: Can I drag tables in floor plan?**
**A:** Not yet - current implementation uses `posX`/`posY` for future drag-and-drop.

---

## 🎉 Success Indicators

**You've successfully set up Table Management if:**
- ✅ Tables load on page open
- ✅ Create modal opens with "Add Table"
- ✅ Status changes reflect immediately
- ✅ No console errors
- ✅ Responsive design works on mobile
- ✅ Error messages display correctly

---

## 📚 Next Steps

1. Test all features (use checklist above)
2. Integrate with OrderEntry module
3. Add kitchen display integration
4. Implement real-time sync (WebSocket)
5. Add table reservation system
6. Generate QR codes for tables

---

## 🆘 Need Help?

All code is fully commented. Check:
- `tableSlice.js` - Redux logic
- `TableManagement.jsx` - UI component
- `api.js` - API calls
- `TABLE_MANAGEMENT_DOCS.md` - Full documentation

**Happy Testing! 🎊**
