import bcrypt from "bcrypt";
import { UserMain } from "../MongoDB/dbConnectionController.js";

// GET /api/search-user
export const searchUser = async (req, res) => {
  try {
    const { q } = req.query;
    const users = await UserMain.find(
      {
        emp_id: { $regex: q, $options: "i" },
        working_status: "Working",
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status",
    );
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
};

// GET /api/user-details
export const getUserDetails = async (req, res) => {
  try {
    const { empId } = req.query;
    if (!empId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const user = await UserMain.findOne(
      { emp_id: empId, working_status: "Working" },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

// GET /api/job-titles
export const getJobTitles = async (req, res) => {
  try {
    const jobTitles = await UserMain.distinct("job_title", {
      working_status: "Working",
    });
    res.json(jobTitles.filter((title) => title));
  } catch (error) {
    console.error("Error fetching job titles:", error);
    res.status(500).json({ message: "Failed to fetch job titles" });
  }
};

// GET /api/users-by-job-title
export const getUsersByJobTitle = async (req, res) => {
  try {
    const { jobTitle } = req.query;
    const users = await UserMain.find(
      {
        job_title: jobTitle,
        working_status: "Working",
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status",
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users by job title:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// GET /users (Note: path is just /users, not /api/users)
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserMain.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// POST /users
export const createUser = async (req, res) => {
  try {
    const {
      emp_id,
      name,
      email,
      job_title,
      eng_name,
      kh_name,
      phone_number,
      dept_name,
      sect_name,
      working_status,
      password,
    } = req.body;

    const existingUserByName = await UserMain.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existingUserByName) {
      return res.status(400).json({
        message: "User already exist! Please Use different Name",
      });
    }

    if (emp_id) {
      const existingUser = await UserMain.findOne({ emp_id });
      if (existingUser) {
        return res.status(400).json({
          message: "Employee ID already exists. Please use a different ID.",
        });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the provided fields.
    const newUser = new UserMain({
      emp_id,
      name,
      email,
      job_title: job_title || "External",
      eng_name,
      kh_name,
      phone_number,
      dept_name,
      sect_name,
      working_status: working_status || "Working",
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// PUT /users/:id
export const updateUser = async (req, res) => {
  try {
    const updatedUser = await UserMain.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// DELETE /users/:id
export const deleteUser = async (req, res) => {
  try {
    await UserMain.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// GET /api/users-paginated
export const getUsersPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const jobTitle = req.query.jobTitle || "";
    const empId = req.query.empId || "";
    const section = req.query.section || "";

    // Build the query object
    const query = {};
    if (jobTitle) {
      query.job_title = jobTitle;
    }
    if (empId) {
      query.emp_id = empId;
    }
    if (section) {
      query.sect_name = section;
    }
    query.working_status = "Working";

    const users = await UserMain.find(query)
      .skip(skip)
      .limit(limit)
      .select("emp_id eng_name kh_name dept_name sect_name job_title")
      .exec();

    const total = await UserMain.countDocuments(query);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching paginated users:", err);
    res.status(500).json({
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

// GET /api/sections
export const getSections = async (req, res) => {
  try {
    const sections = await UserMain.distinct("sect_name", {
      working_status: "Working",
    });
    res.json(sections.filter((section) => section));
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Failed to fetch sections" });
  }
};

// GET /api/user-by-emp-id
export const getUserByEmpId = async (req, res) => {
  try {
    const empId = req.query.emp_id;
    if (!empId) {
      return res.status(400).json({ error: "emp_id is required" });
    }
    const user = await UserMain.findOne({ emp_id: empId }).exec();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      emp_id: user.emp_id,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
    });
  } catch (err) {
    console.error("Error fetching user by emp_id:", err);
    res.status(500).json({
      message: "Failed to fetch user data",
      error: err.message,
    });
  }
};

/* ------------------------------
   Emp id for Inspector Data
------------------------------ */

// Endpoint to fetch a specific user by emp_id
export const getUserByEmpIdForInspector = async (req, res) => {
  try {
    const { emp_id } = req.params;
    const user = await UserMain.findOne(
      { emp_id },
      "emp_id eng_name kh_name job_title dept_name sect_name face_photo",
    ).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(
      `Error fetching user with emp_id ${req.params.emp_id}:`,
      error,
    );
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// NEW ENDPOINT: Search for users by emp_id or name
export const searchUsersByEmpIdOrName = async (req, res) => {
  try {
    const searchTerm = req.query.term;
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.json([]); // Return empty if search term is too short
    }

    // Create a case-insensitive regular expression for searching
    const regex = new RegExp(searchTerm, "i");

    const users = await UserMain.find({
      $and: [
        { working_status: "Working" }, // Ensure only active users
        {
          $or: [{ emp_id: { $regex: regex } }, { eng_name: { $regex: regex } }],
        },
      ],
    })
      .limit(10) // Limit results for performance
      .select("emp_id eng_name job_title face_photo") // Select only needed fields
      .exec();

    res.json(users);
  } catch (err) {
    console.error("Error searching users:", err);
    res
      .status(500)
      .json({ message: "Failed to search for users", error: err.message });
  }
};

export const getWorkingUsers = async (req, res) => {
  try {
    const userList = await UserMain.find(
      { working_status: "Working" }, // Optional: only get active users
      {
        _id: 1,
        emp_id: 1,
        eng_name: 1,
        name: 1,
        dept_name: 1,
        sect_name: 1,
        job_title: 1,
      },
    ).sort({ eng_name: 1 });

    // Transform the data to match what your frontend expects
    const transformedUsers = userList.map((user) => ({
      userId: user.emp_id, // Map emp_id to userId
      _id: user._id,
      name: user.eng_name, // Use eng_name as the display name
      username: user.name, // Keep original name as username
      emp_id: user.emp_id,
      eng_name: user.eng_name,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      job_title: user.job_title,
    }));

    res.json({
      success: true,
      users: transformedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
