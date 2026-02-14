import axios from "axios";
import React, { useEffect, useState } from "react";
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../../config";

const UserForm = ({ fetchUsers, editingUser, setEditingUser }) => {
  const [emp_id, setEmpId] = useState("");
  const [name, setName] = useState("");
  const [eng_name, setEngName] = useState("");
  const [kh_name, setKhName] = useState("");
  const [dept_name, setDepartment] = useState("");
  const [sect_name, setSectName] = useState("");

  useEffect(() => {
    if (editingUser) {
      setEmpId(editingUser.emp_id);
      setName(editingUser.name);
      setEngName(editingUser.eng_name);
      setKhName(editingUser.kh_name);
      setDepartment(editingUser.dept_name);
      setSectName(editingUser.sect_name);
    }
  }, [editingUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      await axios.put(`${API_BASE_URL}/api/users/${editingUser._id}`, {
        emp_id,
        name,
        eng_name,
        kh_name,
        dept_name,
        sect_name
      });
      setEditingUser(null);
    } else {
      await axios.post(`${API_BASE_URL}/api/users`, {
        emp_id,
        name,
        eng_name,
        kh_name,
        dept_name,
        sect_name
      });
    }
    setEmpId("");
    setName("");
    setEngName("");
    setDepartment("");
    setKhName("");
    setSectName("");
    fetchUsers();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Employee ID"
        value={emp_id}
        onChange={(e) => setEmpId(e.target.value)}
      />
      <input
        type="text"
        placeholder="English Name"
        value={eng_name}
        onChange={(e) => setEngName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Khmer Name"
        value={kh_name}
        onChange={(e) => setKhName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Department"
        value={dept_name}
        onChange={(e) => setDepartment(e.target.value)}
      />
      <input
        type="text"
        placeholder="Section Name"
        value={sect_name}
        onChange={(e) => setSectName(e.target.value)}
      />
      <button type="submit">{editingUser ? "Update" : "Add"} User</button>
    </form>
  );
};

export default UserForm;
