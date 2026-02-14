import { UserMain, RoleManagment } from "../MongoDB/dbConnectionController.js";

// POST /api/role-management
export const manageRole = async (req, res) => {
  try {
    const { role, jobTitles, selectedUsers } = req.body;

    // Get only the selected users' data
    const users = await UserMain.find(
      {
        emp_id: { $in: selectedUsers },
        working_status: "Working",
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status",
    );

    let roleDoc = await RoleManagment.findOne({ role });

    if (roleDoc) {
      roleDoc.jobTitles = jobTitles;
      roleDoc.users = users.map((user) => ({
        emp_id: user.emp_id,
        name: user.name,
        eng_name: user.eng_name,
        kh_name: user.kh_name,
        job_title: user.job_title,
        dept_name: user.dept_name,
        sect_name: user.sect_name,
        working_status: user.working_status,
        phone_number: user.phone_number,
        face_photo: user.face_photo,
      }));
    } else {
      roleDoc = new RoleManagment({
        role,
        jobTitles,
        users: users.map((user) => ({
          emp_id: user.emp_id,
          name: user.name,
          eng_name: user.eng_name,
          kh_name: user.kh_name,
          job_title: user.job_title,
          dept_name: user.dept_name,
          sect_name: user.sect_name,
          working_status: user.working_status,
          phone_number: user.phone_number,
          face_photo: user.face_photo,
        })),
      });
    }

    await roleDoc.save();
    res.json({
      message: `Role ${roleDoc._id ? "updated" : "added"} successfully`,
    });
  } catch (error) {
    console.error("Error saving role:", error);
    res.status(500).json({ message: "Failed to save role" });
  }
};

// GET /api/user-roles/:empId
export const getUserRoles = async (req, res) => {
  try {
    const { empId } = req.params;
    const roles = [];

    // Check Super Admin role first
    const superAdminRole = await RoleManagment.findOne({
      role: "Super Admin",
      "users.emp_id": empId,
    });

    if (superAdminRole) {
      roles.push("Super Admin");
      return res.json({ roles }); // Return early if Super Admin
    }

    // Check Admin role
    const adminRole = await RoleManagment.findOne({
      role: "Admin",
      "users.emp_id": empId,
    });

    if (adminRole) {
      roles.push("Admin");
      return res.json({ roles }); // Return early if Admin
    }

    // Get other roles
    const otherRoles = await RoleManagment.find({
      role: { $nin: ["Super Admin", "Admin"] },
      "users.emp_id": empId,
    });

    otherRoles.forEach((roleDoc) => {
      roles.push(roleDoc.role);
    });

    res.json({ roles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ message: "Failed to fetch user roles" });
  }
};

// GET /api/role-management
export const getRoleManagement = async (req, res) => {
  try {
    const roles = await RoleManagment.find({}).sort({
      role: 1, // Sort by role name
    });
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// POST /api/role-management/super-admin
export const registerSuperAdmin = async (req, res) => {
  try {
    const { user } = req.body;

    let superAdminRole = await RoleManagment.findOne({ role: "Super Admin" });

    if (!superAdminRole) {
      superAdminRole = new RoleManagment({
        role: "Super Admin",
        jobTitles: ["Developer"],
        users: [],
      });
    }

    const userExists = superAdminRole.users.some(
      (u) => u.emp_id === user.emp_id,
    );

    if (userExists) {
      return res.status(400).json({ message: "User is already a Super Admin" });
    }

    const userDetails = await UserMain.findOne(
      { emp_id: user.emp_id },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status",
    );

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    superAdminRole.users.push({
      emp_id: userDetails.emp_id,
      name: userDetails.name,
      eng_name: userDetails.eng_name,
      kh_name: userDetails.kh_name,
      job_title: "Developer",
      dept_name: userDetails.dept_name,
      sect_name: userDetails.sect_name,
      working_status: userDetails.working_status,
      phone_number: userDetails.phone_number,
      face_photo: userDetails.face_photo,
    });

    await superAdminRole.save();
    res.json({ message: "Super Admin registered successfully" });
  } catch (error) {
    console.error("Error registering super admin:", error);
    res.status(500).json({ message: "Failed to register super admin" });
  }
};

// DELETE /api/role-management/super-admin/:empId
export const deleteSuperAdmin = async (req, res) => {
  try {
    const { empId } = req.params;

    // Find the Super Admin role
    const superAdminRole = await RoleManagment.findOne({ role: "Super Admin" });

    if (!superAdminRole) {
      return res.status(404).json({ message: "Super Admin role not found" });
    }

    // Check if the employee ID is in the protected list
    const protectedEmpIds = ["TL04", "TL09"];
    if (protectedEmpIds.includes(empId)) {
      return res.status(403).json({
        message: "Cannot delete protected Super Admin users",
      });
    }

    // Find the user index in the users array
    const userIndex = superAdminRole.users.findIndex(
      (user) => user.emp_id === empId,
    );

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found in Super Admin role",
      });
    }

    // Remove the user from the array using MongoDB update
    const result = await RoleManagment.updateOne(
      { role: "Super Admin" },
      {
        $pull: {
          users: { emp_id: empId },
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        message: "Failed to remove Super Admin",
      });
    }

    // Fetch the updated document
    const updatedRole = await RoleManagment.findOne({ role: "Super Admin" });

    res.json({
      message: "Super Admin removed successfully",
      updatedRole: updatedRole,
    });
  } catch (error) {
    console.error("Error removing super admin:", error);
    res.status(500).json({ message: "Failed to remove super admin" });
  }
};

// Update user roles
export const updateUserRoles = async (req, res) => {
  try {
    const { emp_id, currentRoles, newRoles, userData } = req.body;

    // Find roles to remove (in currentRoles but not in newRoles)
    const rolesToRemove = currentRoles.filter(
      (role) => !newRoles.includes(role),
    );

    // Find roles to add (in newRoles but not in currentRoles)
    const rolesToAdd = newRoles.filter((role) => !currentRoles.includes(role));

    // Remove user from roles
    for (const role of rolesToRemove) {
      const roleDoc = await RoleManagment.findOne({ role });
      if (roleDoc) {
        // Remove user from users array
        roleDoc.users = roleDoc.users.filter((u) => u.emp_id !== emp_id);

        // Check if there are any other users with the same job title
        const otherUsersWithSameTitle = roleDoc.users.some(
          (u) => u.job_title === userData.job_title,
        );
        if (!otherUsersWithSameTitle) {
          roleDoc.jobTitles = roleDoc.jobTitles.filter(
            (t) => t !== userData.job_title,
          );
        }

        await roleDoc.save();
      }
    }

    // Add user to new roles
    for (const role of rolesToAdd) {
      const roleDoc = await RoleManagment.findOne({ role });
      if (roleDoc) {
        // Add job title if not exists
        if (!roleDoc.jobTitles.includes(userData.job_title)) {
          roleDoc.jobTitles.push(userData.job_title);
        }

        // Add user if not exists
        if (!roleDoc.users.some((u) => u.emp_id === emp_id)) {
          roleDoc.users.push(userData);
        }

        await roleDoc.save();
      }
    }

    res.json({
      success: true,
      message: "User roles updated successfully",
    });
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user roles",
    });
  }
};

// Get user roles
export const getUserRole = async (req, res) => {
  try {
    const { empId } = req.params;
    const roles = [];

    // Find all roles where this user exists
    const userRoles = await RoleManagment.find({
      "users.emp_id": empId,
    });

    userRoles.forEach((role) => {
      if (!["Super Admin", "Admin"].includes(role.role)) {
        roles.push(role.role);
      }
    });

    res.json({ roles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ message: "Failed to fetch user roles" });
  }
};

// GET /api/role-management/search
export const searchRoles = async (req, res) => {
  try {
    const { query, type } = req.query; // type: 'role', 'emp_id', 'name', 'job_title'

    let roles = await RoleManagment.find({}).sort({ role: 1 });

    if (query && type) {
      const searchQuery = query.toLowerCase();

      switch (type) {
        case "role":
          roles = roles.filter((r) =>
            r.role.toLowerCase().includes(searchQuery),
          );
          break;
        case "emp_id":
          roles = roles
            .filter((r) =>
              r.users.some((u) =>
                u.emp_id?.toLowerCase().includes(searchQuery),
              ),
            )
            .map((r) => ({
              ...r.toObject(),
              users: r.users.filter((u) =>
                u.emp_id?.toLowerCase().includes(searchQuery),
              ),
            }));
          break;
        case "name":
          roles = roles
            .filter((r) =>
              r.users.some(
                (u) =>
                  u.name?.toLowerCase().includes(searchQuery) ||
                  u.eng_name?.toLowerCase().includes(searchQuery),
              ),
            )
            .map((r) => ({
              ...r.toObject(),
              users: r.users.filter(
                (u) =>
                  u.name?.toLowerCase().includes(searchQuery) ||
                  u.eng_name?.toLowerCase().includes(searchQuery),
              ),
            }));
          break;
        case "job_title":
          roles = roles
            .filter((r) =>
              r.users.some((u) =>
                u.job_title?.toLowerCase().includes(searchQuery),
              ),
            )
            .map((r) => ({
              ...r.toObject(),
              users: r.users.filter((u) =>
                u.job_title?.toLowerCase().includes(searchQuery),
              ),
            }));
          break;
        default:
          break;
      }
    }

    res.json(roles);
  } catch (error) {
    console.error("Error searching roles:", error);
    res.status(500).json({ message: "Failed to search roles" });
  }
};

// GET /api/role-management/user-search/:empId
export const getUserRoleDetails = async (req, res) => {
  try {
    const { empId } = req.params;

    const rolesWithUser = await RoleManagment.find({
      "users.emp_id": empId,
    });

    const result = rolesWithUser.map((role) => ({
      role: role.role,
      user: role.users.find((u) => u.emp_id === empId),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching user role details:", error);
    res.status(500).json({ message: "Failed to fetch user role details" });
  }
};
