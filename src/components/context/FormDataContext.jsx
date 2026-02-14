import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../authentication/AuthContext";

const FormDataContext = createContext();

export const FormDataProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.emp_id || "anonymous";

  const getDefaultData = useCallback(
    () => ({
      // Memoize default data structure
      bundleRegistration: {
        date: new Date().toISOString(),
        department: "",
        selectedMono: "",
        buyer: "",
        orderQty: "",
        factoryInfo: "",
        custStyle: "",
        country: "",
        color: "",
        size: "",
        bundleQty: 1,
        lineNo: "",
        count: 10,
        colorCode: "",
        chnColor: "",
        colorKey: "",
        sizeOrderQty: "",
        planCutQty: "",
        isSubCon: false,
        subConName: "",
      },
      washing: {},
      dyeing: {},
      ironing: {},
      packing: {},
      qc1Inspection: {},
      qc2Inspection: {},
      qaAudit: {},
    }),
    [],
  );

  const [internalFormData, setInternalFormData] = useState(() => {
    if (userId && userId !== "anonymous") {
      try {
        const savedData = localStorage.getItem(`formData_${userId}`);
        if (savedData) {
          return JSON.parse(savedData);
        }
      } catch (error) {
        console.error("Error parsing saved form data on initial load:", error);
      }
    }
    return getDefaultData();
  });

  // Effect to load/reset data when userId changes
  useEffect(() => {
    if (userId && userId !== "anonymous") {
      try {
        const savedData = localStorage.getItem(`formData_${userId}`);
        setInternalFormData(
          savedData ? JSON.parse(savedData) : getDefaultData(),
        );
      } catch (error) {
        console.error("Error loading form data on user change:", error);
        setInternalFormData(getDefaultData());
      }
    } else if (userId === "anonymous") {
      setInternalFormData(getDefaultData());
    }
  }, [userId, getDefaultData]);

  // Effect to save to localStorage ONLY when internalFormData truly changes content
  // This requires careful string comparison or deep comparison if performance allows
  const stringifiedFormData = useMemo(
    () => JSON.stringify(internalFormData),
    [internalFormData],
  );

  useEffect(() => {
    if (userId && userId !== "anonymous") {
      const currentStoredData = localStorage.getItem(`formData_${userId}`);
      if (currentStoredData !== stringifiedFormData) {
        // Only save if different
        localStorage.setItem(`formData_${userId}`, stringifiedFormData);
      }
    }
  }, [stringifiedFormData, userId]);

  const updateFormData = useCallback((formName, data) => {
    setInternalFormData((prev) => {
      const currentFormState = prev[formName] || {};
      let hasChanged = false;
      const updatedFormPart = { ...currentFormState };

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          let newValue = data[key];
          // Ensure date is stored as ISO string if it's a Date object
          if (key === "date" && newValue instanceof Date) {
            newValue = newValue.toISOString();
          }
          if (currentFormState[key] !== newValue) {
            updatedFormPart[key] = newValue;
            hasChanged = true;
          }
        }
      }

      if (hasChanged) {
        return { ...prev, [formName]: updatedFormPart };
      }
      return prev; // Return previous state if no actual change to avoid re-render loop
    });
  }, []);

  const clearFormData = useCallback(
    (formName) => {
      setInternalFormData((prev) => ({
        ...prev,
        [formName]:
          formName === "bundleRegistration"
            ? {
                ...getDefaultData().bundleRegistration,
                date: new Date().toISOString(),
              }
            : {},
      }));
    },
    [getDefaultData],
  );

  // Convert date strings back to Date objects for consuming components
  const formDataForConsumer = useMemo(() => {
    const newFormData = { ...internalFormData };
    if (
      newFormData.bundleRegistration &&
      newFormData.bundleRegistration.date &&
      typeof newFormData.bundleRegistration.date === "string"
    ) {
      try {
        newFormData.bundleRegistration = {
          ...newFormData.bundleRegistration,
          date: new Date(newFormData.bundleRegistration.date),
        };
      } catch (e) {
        console.error(
          "Error parsing date from context for consumer:",
          newFormData.bundleRegistration.date,
          e,
        );
        // keep original string if parsing fails
      }
    }
    return newFormData;
  }, [internalFormData]);

  return (
    <FormDataContext.Provider
      value={{
        formData: formDataForConsumer,
        updateFormData,
        clearFormData,
      }}
    >
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error("useFormData must be used within a FormDataProvider");
  }
  return context;
};
