Setting up a local database in Jetpack Compose using Room, Hilt, and Jetpack libraries can be straightforward with a few basic steps. Here’s a guide to help you understand and implement the concept:

### 1. **Overview of Components**:
   - **Room**: An Android library that provides an abstraction layer over SQLite for better access to a database.
   - **Hilt**: A dependency injection library that simplifies injecting dependencies into Android components, making it easier to manage and test.
   - **Jetpack Compose**: The modern toolkit for building native Android UI.

### 2. **Project Setup**:
Ensure you have the following dependencies in your `build.gradle` files.
First, add the `hilt-android-gradle-plugin` plugin to your project's root `build.gradle` file:

   ```kotlin
   plugins {
  ...
  id("com.google.dagger.hilt.android") version "2.51.1" apply false
}
   ```
Then, apply the Gradle plugin and add these dependencies in your `app/build.gradle` file:

```kotlin
plugins {
  id("kotlin-kapt")
  id("com.google.dagger.hilt.android")
}

android {
  ...
}

dependencies {
  implementation("com.google.dagger:hilt-android:2.51.1")
  kapt("com.google.dagger:hilt-android-compiler:2.51.1")
}

// Allow references to generated code
kapt {
  correctErrorTypes = true
}
```

### 3. **Define Entity and DAO**:
   - **Entity**: Represents a table in your Room database.
   - **DAO (Data Access Object)**: Interface with methods to query and interact with the database.

#### Example - Entity
Here, we’ll create a simple `User` entity.

   ```kotlin
   @Entity(tableName = "users")
   data class User(
       @PrimaryKey(autoGenerate = true) val id: Int = 0,
       val name: String,
       val age: Int
   )
   ```

#### Example - DAO
The DAO will define the SQL queries and actions for interacting with the `User` entity.

   ```kotlin
   @Dao
   interface UserDao {
       @Insert(onConflict = OnConflictStrategy.REPLACE)
       suspend fun insertUser(user: User)

       @Query("SELECT * FROM users")
       fun getAllUsers(): Flow<List<User>>
   }
   ```

### 4. **Database Class**:
Define a Room database class with the `@Database` annotation. Add your DAOs here.

   ```kotlin
   @Database(entities = [User::class], version = 1, exportSchema = false)
   abstract class AppDatabase : RoomDatabase() {
       abstract fun userDao(): UserDao
   }
   ```

### 5. **Hilt Module for Dependency Injection**:
Use Hilt to provide a singleton instance of `AppDatabase` and `UserDao`.

   ```kotlin
   @Module
   @InstallIn(SingletonComponent::class)
   object DatabaseModule {
       @Provides
       @Singleton
       fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
           return Room.databaseBuilder(
               context,
               AppDatabase::class.java,
               "app_database"
           ).build()
       }

       @Provides
       fun provideUserDao(database: AppDatabase): UserDao {
           return database.userDao()
       }
   }
   ```

### 6. **Repository**:
It’s a good practice to add a repository layer to separate data sources from the rest of the app logic.

   ```kotlin
   class UserRepository @Inject constructor(private val userDao: UserDao) {
       fun getAllUsers() = userDao.getAllUsers()
       suspend fun insertUser(user: User) = userDao.insertUser(user)
   }
   ```

### 7. **ViewModel**:
With Hilt, you can inject the repository into a ViewModel to manage the data in your Composable functions.

   ```kotlin
   @HiltViewModel
   class UserViewModel @Inject constructor(private val repository: UserRepository) : ViewModel() {
       val allUsers = repository.getAllUsers().asLiveData()

       fun addUser(user: User) {
           viewModelScope.launch {
               repository.insertUser(user)
           }
       }
   }
   ```

### 8. **UI Layer with Jetpack Compose**:
Create a simple Compose UI to display the users and add new ones.

   ```kotlin
   @Composable
   fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
       val users by viewModel.allUsers.observeAsState(emptyList())

       Column {
           // Display list of users
           LazyColumn {
               items(users) { user ->
                   Text(text = "${user.name}, ${user.age}")
               }
           }
           // Add user button
           Button(onClick = {
               viewModel.addUser(User(name = "New User", age = 25))
           }) {
               Text("Add User")
           }
       }
   }
   ```

### 9. **Set up Hilt in the Application Class**:
Don’t forget to set up Hilt in your `Application` class.

   ```kotlin
   @HiltAndroidApp
   class MyApp : Application()
   ```

### 10. **Use the UI in MainActivity**:
In your `MainActivity`, set up Hilt and call your `UserScreen`.

   ```kotlin
   @AndroidEntryPoint
   class MainActivity : ComponentActivity() {
       override fun onCreate(savedInstanceState: Bundle?) {
           super.onCreate(savedInstanceState)
           setContent {
               UserScreen()
           }
       }
   }
   ```



If you have multiple tables, you can extend the setup by adding more entities, DAOs, and repositories. Here’s how you can modify the code to work with multiple tables.

### 1. **Define Additional Entities**
Let’s say you want to add a `Post` table alongside the existing `User` table.

#### User Entity (existing)
   ```kotlin
   @Entity(tableName = "users")
   data class User(
       @PrimaryKey(autoGenerate = true) val id: Int = 0,
       val name: String,
       val age: Int
   )
   ```

#### Post Entity (new)
   ```kotlin
   @Entity(tableName = "posts")
   data class Post(
       @PrimaryKey(autoGenerate = true) val postId: Int = 0,
       val userId: Int, // foreign key to User
       val title: String,
       val content: String
   )
   ```

### 2. **Create Additional DAOs**
Each table should have its own DAO interface. For instance, a `PostDao` for the `Post` entity.

#### UserDao (existing)
   ```kotlin
   @Dao
   interface UserDao {
       @Insert(onConflict = OnConflictStrategy.REPLACE)
       suspend fun insertUser(user: User)

       @Query("SELECT * FROM users")
       fun getAllUsers(): Flow<List<User>>
   }
   ```

#### PostDao (new)
   ```kotlin
   @Dao
   interface PostDao {
       @Insert(onConflict = OnConflictStrategy.REPLACE)
       suspend fun insertPost(post: Post)

       @Query("SELECT * FROM posts WHERE userId = :userId")
       fun getPostsForUser(userId: Int): Flow<List<Post>>
   }
   ```

### 3. **Update Database Class**
Your `AppDatabase` should now include both DAOs. Also, list both `User` and `Post` entities in the `@Database` annotation.

   ```kotlin
   @Database(entities = [User::class, Post::class], version = 1, exportSchema = false)
   abstract class AppDatabase : RoomDatabase() {
       abstract fun userDao(): UserDao
       abstract fun postDao(): PostDao
   }
   ```

### 4. **Modify Hilt Module for Dependency Injection**
In the Hilt module, provide both DAOs for dependency injection.

   ```kotlin
   @Module
   @InstallIn(SingletonComponent::class)
   object DatabaseModule {
       @Provides
       @Singleton
       fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
           return Room.databaseBuilder(
               context,
               AppDatabase::class.java,
               "app_database"
           ).build()
       }

       @Provides
       fun provideUserDao(database: AppDatabase): UserDao {
           return database.userDao()
       }

       @Provides
       fun providePostDao(database: AppDatabase): PostDao {
           return database.postDao()
       }
   }
   ```

### 5. **Create Additional Repositories**
Each DAO typically has a corresponding repository to manage the data operations separately.

#### UserRepository (existing)
   ```kotlin
   class UserRepository @Inject constructor(private val userDao: UserDao) {
       fun getAllUsers() = userDao.getAllUsers()
       suspend fun insertUser(user: User) = userDao.insertUser(user)
   }
   ```

#### PostRepository (new)
   ```kotlin
   class PostRepository @Inject constructor(private val postDao: PostDao) {
       fun getPostsForUser(userId: Int) = postDao.getPostsForUser(userId)
       suspend fun insertPost(post: Post) = postDao.insertPost(post)
   }
   ```

### 6. **Update ViewModel to Include Multiple Repositories**
If you want to interact with both users and posts in a single ViewModel, inject both `UserRepository` and `PostRepository`.

   ```kotlin
   @HiltViewModel
   class MainViewModel @Inject constructor(
       private val userRepository: UserRepository,
       private val postRepository: PostRepository
   ) : ViewModel() {

       val allUsers = userRepository.getAllUsers().asLiveData()
       val postsForUser = MutableLiveData<List<Post>>()

       fun loadPostsForUser(userId: Int) {
           viewModelScope.launch {
               postRepository.getPostsForUser(userId).collect { posts ->
                   postsForUser.value = posts
               }
           }
       }

       fun addUser(user: User) {
           viewModelScope.launch {
               userRepository.insertUser(user)
           }
       }

       fun addPost(post: Post) {
           viewModelScope.launch {
               postRepository.insertPost(post)
           }
       }
   }
   ```

### 7. **Compose UI**
You can then create UI elements to display both users and their posts, updating as data is added or removed.

   ```kotlin
   @Composable
   fun MainScreen(viewModel: MainViewModel = hiltViewModel()) {
       val users by viewModel.allUsers.observeAsState(emptyList())
       val posts by viewModel.postsForUser.observeAsState(emptyList())

       // UI to display users and their posts
       Column {
           LazyColumn {
               items(users) { user ->
                   Text(text = "${user.name}, ${user.age}")
                   Button(onClick = { viewModel.loadPostsForUser(user.id) }) {
                       Text("Load Posts")
                   }
               }
           }

           Spacer(modifier = Modifier.height(16.dp))

           Text("Posts:")
           LazyColumn {
               items(posts) { post ->
                   Text(text = "${post.title}: ${post.content}")
               }
           }
       }
   }
   ```

This setup allows you to manage multiple tables, each with its own DAO and repository, while using Hilt for dependency injection. The UI can then observe data from both tables, allowing you to display related data (e.g., users and their posts) in Jetpack Compose.

### Summary
- **Room** manages the database with tables and queries.
- **Hilt** injects dependencies, making the setup modular and testable.
- **ViewModel** handles the data for the Composable UI, ensuring that data survives configuration changes.
- **Jetpack Compose** provides the UI, allowing you to observe LiveData or Flow from the ViewModel and reflect changes in the database directly in the UI.
