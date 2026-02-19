# Quick Fix Guide - FoodOs Startup Issues

## 🚀 IMMEDIATE ACTION REQUIRED

Your application has multiple fixes applied but requires a **FULL REBUILD** to work properly.

### Step 1: Clean Build Directory
```powershell
cd "D:\SGP 4\Code\FoodOs"
Remove-Item -Path ".\target" -Recurse -Force
```

### Step 2: Rebuild Project

**Option A: Using IntelliJ IDEA**
1. Click `Build` → `Rebuild Project`
2. Wait for build to complete
3. Run the application

**Option B: Using Maven (if configured)**
```powershell
.\mvnw.cmd clean package -DskipTests
```

### Step 3: Run Application
- Use IntelliJ's Run button
- Or run `FoodOsApplication` main class

---

## ✅ What Was Fixed

### 1. Repository Query Issue ⚠️ CRITICAL
**File:** `RestaurantTableRepository.java`

**Problem:** Spring Data JPA couldn't derive queries
```
No property 'uuid' found for type 'Restaurant'
```

**Solution:** Added explicit `@Query` annotations for:
- `findByIsDeletedFalseAndRestaurantUuid()`
- `findByIsDeletedFalseAndRestaurantUuidAndStatus()`

---

### 2. Service Layer Issues
**File:** `RestaurantTableService.java`

**Fixed:**
- ✅ Removed unused import
- ✅ Fixed BigDecimal → Double conversion for `totalAmount`
- ✅ Modernized code with `.toList()` (4 locations)

---

### 3. Missing Order Method
**Files:** `OrderService.java`, `OrderServiceImpl.java`

**Added:** `getOrderEntityByUuid(String orderUuid)` method

---

## ⚠️ Why Full Rebuild is Needed

The error you saw:
```
java.lang.ClassNotFoundException: RestaurantTableRepository
```

This happens because:
1. Spring DevTools hot reload doesn't always recompile repository interfaces
2. The `.class` file in `target/classes` is outdated
3. A full rebuild regenerates all compiled classes

---

## 🧪 Testing After Restart

### 1. Check Application Starts
Look for:
```
Started FoodOsApplication in X.XXX seconds
```

### 2. Test Endpoints
```bash
# Health check
GET http://localhost:8081/actuator/health

# Get tables (replace with actual restaurantUuid)
GET http://localhost:8081/api/v1/tables?restaurantUuid=YOUR-UUID
```

---

## 📋 Verification Checklist

- [ ] Target directory cleaned
- [ ] Project rebuilt successfully
- [ ] No compilation errors in IDE
- [ ] Application starts without exceptions
- [ ] Can access Swagger UI: http://localhost:8081/swagger-ui.html
- [ ] Table endpoints respond correctly
- [ ] Order endpoints respond correctly

---

## 🆘 If Problems Persist

### Error: "NoClassDefFoundError"
**Solution:** Clean and rebuild again
```powershell
Remove-Item -Path ".\target" -Recurse -Force
# Then rebuild in IDE
```

### Error: "Could not create query"
**Solution:** Check `RestaurantTableRepository.java` has @Query annotations on lines 31-39

### Error: Method not found
**Solution:** Verify `OrderServiceImpl.java` has `getOrderEntityByUuid()` method

---

## 📚 Documentation
- Complete details: `REPOSITORY_QUERY_FIX.md`
- Previous fixes: `fixes_summary.md`

---

## ⏰ Estimated Time
- Clean + Rebuild: **2-3 minutes**
- Application Startup: **10-15 seconds**
- Total: **~5 minutes**

---

## 👍 Success Indicators

You'll know it worked when you see:
1. ✅ No red errors in console
2. ✅ "Started FoodOsApplication" message
3. ✅ Tomcat running on port 8081
4. ✅ 13 JPA repositories initialized
5. ✅ No ClassNotFoundException

---

**Last Updated:** February 19, 2026, 9:15 PM IST

