# Infinity Fitness

**Infinity Fitness** is a full-stack gym management web application that helps manage the day-to-day activities of a gym through three different portals:

- **Admin** — manages the overall gym
- **Trainer** — manages assigned members, workouts, and progress
- **Member** — views their membership, attendance, workouts, and progress

The system brings common gym activities such as members, trainers, memberships, payments, attendance, and workout management into one platform.

---

## 🔗 Live Demo

**Website:** YOUR_LIVE_WEBSITE_URL

---

# 🔐 Demo Admin Account

> **Start here!** Use the demo Admin account to explore the application.

### Admin Login

**Email**
```text
saugat.owner@gmail.com
```

**Password**
```text
t4S0dMFBf1QRxlLP
```

After logging in as Admin, you can create your own **Trainer** and **Member** accounts and use them to explore the other portals.

> **Note:** This is a demo account. The data may change as the project is updated.

---

# 🚀 How to Use Infinity Fitness

The easiest way to explore the application is to follow this order:

**Admin → Create Trainer → Create Member → Membership → Assign Trainer → Trainer → Workout → Member**

---

## 1. Login as Admin

Open the website and select the **Admin Portal**.

Use the demo credentials:

```text
Email: demo@infinityfitness.com
Password: DemoAdmin123!
```

After logging in, you will see the Admin Dashboard.

---

## 2. Create a Trainer

From the Admin Portal, go to:

**Trainers → Add Trainer**

Enter the trainer's details and create an account.

For example:

```text
Name: Rahul Sharma
Email: rahul@example.com
Password: Trainer123!
```

Keep these credentials because you will use them to log in to the Trainer Portal later.

---

## 3. Create a Member

From the Admin Portal, go to:

**Members → Add Member**

Create a member account.

For example:

```text
Name: Saugat Rai
Email: member@example.com
Password: Member123!
```

Keep these credentials because you will use them to log in to the Member Portal later.

---

## 4. Create a Membership Plan

Go to:

**Membership Plans → Add Plan**

For example:

```text
Plan: Premium
Duration: 30 days
Price: NPR 3000
```

Save the membership plan.

---

## 5. Assign a Membership

Open the member you created and assign a membership plan.

You can set the:

- Membership plan
- Start date
- End date
- Status

The member will then be able to see their membership from the Member Portal.

---

## 6. Add a Payment

Go to:

**Payments → Add Payment**

Select the member and enter the payment information.

This allows you to explore the payment management features of the Admin Portal.

---

## 7. Assign a Trainer to the Member

Open the member's profile and assign the trainer you created earlier.

Now the trainer can work with that member.

This is also important for testing the access control of the application because trainers can only access members assigned to them.

---

# 🧑‍🏫 Explore the Trainer Portal

Log out from the Admin account.

Open the **Trainer Portal** and use the trainer account you created earlier.

The Trainer Portal allows trainers to:

- View assigned members
- Create workout plans
- Add workout days
- Add exercises
- Track member progress
- View notifications

---

## 8. Create a Workout Plan

From the Trainer Portal:

1. Open the assigned member.
2. Create a workout plan.
3. Add workout days.
4. Add exercises.
5. Save the workout plan.

For example:

```text
Workout Plan
    ↓
Monday
    ↓
Bench Press
Squats
Push Ups
```

The assigned member will then be able to view the workout plan from the Member Portal.

---

# 👤 Explore the Member Portal

Log out from the Trainer account.

Open the **Member Portal** and use the member account you created earlier.

The Member Portal allows members to view:

- Dashboard
- Membership
- Attendance
- Workout Plan
- Progress
- Notifications

You should now be able to see the membership and workout information that you created earlier.

---

# 🔔 Notifications

Infinity Fitness also includes a notification system.

Depending on the user's role, notifications can be viewed from the relevant Admin, Trainer, or Member portal.

---

# 📋 Audit Log

Admins can access:

**Admin Portal → Audit Log**

The Audit Log records important administrative activities performed inside the system.

This helps administrators keep track of important changes made to the system.

---

# 🔒 Role-Based Access

Infinity Fitness uses role-based access control to make sure users can only access the parts of the system they are allowed to use.

| Role | Main Access |
|------|-------------|
| **Admin** | Manages the overall gym system |
| **Trainer** | Manages assigned members, workouts, and progress |
| **Member** | Views their own gym information |

For example:

- A Member cannot access Admin pages.
- A Trainer cannot access Admin pages.
- A Trainer cannot access members who are not assigned to them.
- A Member cannot view another member's information.

---

# ✨ Main Features

- Admin Dashboard
- Member Management
- Trainer Management
- Membership Plans
- Membership Management
- Payment Management
- Attendance Management
- Trainer-Member Assignment
- Workout Plans
- Exercise Management
- Progress Tracking
- Notifications
- Audit Logs
- Role-Based Access Control
- Responsive Design

---

# 🛠️ Technologies Used

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Next.js
- Server Actions
- API Routes
- Auth.js

### Database

- PostgreSQL
- Prisma ORM
- Neon

### Other

- Zod
- Git
- GitHub
- Vercel

---

# 💻 Run the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/THeOGSaugat/Infinity-Fitness.git
```

### 2. Go into the project

```bash
cd Infinity-Fitness
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create your environment file using `.env.example` and add the required database and authentication configuration.

> Do not commit your `.env` files or secret values to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

> A PostgreSQL database and the required environment variables are needed to run the project locally.

---

# 👨‍💻 Developer

**Saugat Chamling**

Itahari International College

---

## ⭐ Explore Infinity Fitness

For the best experience, follow this order:

**Admin Login**

↓

**Create Trainer**

↓

**Create Member**

↓

**Create Membership Plan**

↓

**Assign Membership**

↓

**Add Payment**

↓

**Assign Trainer**

↓

**Trainer Login**

↓

**Create Workout Plan**

↓

**Track Progress**

↓

**Member Login**

↓

**View Membership, Attendance, Workout & Progress**
