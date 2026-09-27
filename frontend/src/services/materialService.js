import api from "./api";

export const materialService = {
  getMaterials: async () => {
    const response = await api.get("/materials");
    return response.data;
  },

  createMaterial: async (materialData) => {
    const response = await api.post("/materials", materialData);
    return response.data;
  },

  updateMaterial: async (id, materialData) => {
    const response = await api.put(`/materials/${id}`, materialData);
    return response.data;
  },

  deleteMaterial: async (id) => {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  },
};

