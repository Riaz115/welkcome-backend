import Address from "../models/addressModel.js";

export const createAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const addressData = { ...req.body, userId };

    if (addressData.isDefault) {
      await Address.updateMany({ userId, isActive: true }, { isDefault: false });
    }

    const address = new Address(addressData);
    await address.save();

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create address",
      error: error.message
    });
  }
};

export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, country, city } = req.query;

    const query = { userId, isActive: true };
    if (country) query.country = new RegExp(country, 'i');
    if (city) query.city = new RegExp(city, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const addresses = await Address.find(query)
      .sort({ isDefault: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalAddresses = await Address.countDocuments(query);

    res.json({
      success: true,
      data: {
        addresses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalAddresses / parseInt(limit)),
          totalAddresses,
          hasNextPage: skip + addresses.length < totalAddresses,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
      error: error.message
    });
  }
};

export const getAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({
      _id: addressId,
      userId,
      isActive: true
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch address",
      error: error.message
    });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const existingAddress = await Address.findOne({
      _id: addressId,
      userId,
      isActive: true
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    if (updateData.isDefault) {
      await Address.updateMany(
        { userId, _id: { $ne: addressId }, isActive: true },
        { isDefault: false }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({
      _id: addressId,
      userId,
      isActive: true
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    if (address.isDefault) {
      const otherAddress = await Address.findOne({
        userId,
        _id: { $ne: addressId },
        isActive: true
      });

      if (otherAddress) {
        otherAddress.isDefault = true;
        await otherAddress.save();
      }
    }

    address.isActive = false;
    await address.save();

    res.json({
      success: true,
      message: "Address deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete address",
      error: error.message
    });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({
      _id: addressId,
      userId,
      isActive: true
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    await Address.updateMany(
      { userId, _id: { $ne: addressId }, isActive: true },
      { isDefault: false }
    );

    address.isDefault = true;
    await address.save();

    res.json({
      success: true,
      message: "Default address updated successfully",
      data: address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to set default address",
      error: error.message
    });
  }
};

export const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    const defaultAddress = await Address.findOne({
      userId,
      isDefault: true,
      isActive: true
    });

    if (!defaultAddress) {
      return res.status(404).json({
        success: false,
        message: "No default address found"
      });
    }

    res.json({
      success: true,
      data: defaultAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch default address",
      error: error.message
    });
  }
};

export const getAddressStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Address.aggregate([
      {
        $match: { userId: userId, isActive: true }
      },
      {
        $group: {
          _id: null,
          totalAddresses: { $sum: 1 },
          countries: { $addToSet: "$country" },
          cities: { $addToSet: "$city" },
          hasDefault: {
            $sum: { $cond: ["$isDefault", 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalAddresses: 0,
      countries: [],
      cities: [],
      hasDefault: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        hasDefault: result.hasDefault > 0,
        uniqueCountries: result.countries.length,
        uniqueCities: result.cities.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch address statistics",
      error: error.message
    });
  }
};

export const searchAddressesByLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { country, state, city, query } = req.query;

    let searchQuery = { userId, isActive: true };

    if (country) searchQuery.country = new RegExp(country, 'i');
    if (state) searchQuery.state = new RegExp(state, 'i');
    if (city) searchQuery.city = new RegExp(city, 'i');

    if (query) {
      searchQuery.$or = [
        { streetAddress: new RegExp(query, 'i') },
        { landmark: new RegExp(query, 'i') },
        { buildingName: new RegExp(query, 'i') },
        { area: new RegExp(query, 'i') },
        { postalCode: new RegExp(query, 'i') }
      ];
    }

    const addresses = await Address.find(searchQuery)
      .sort({ isDefault: -1, createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search addresses",
      error: error.message
    });
  }
};

export const bulkUpdateAddresses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { operations } = req.body;

    if (!Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        message: "Operations must be an array"
      });
    }

    const results = [];

    for (const operation of operations) {
      const { action, addressId, data } = operation;

      switch (action) {
        case 'update':
          if (!addressId || !data) {
            results.push({ addressId, success: false, error: "Missing addressId or data" });
            continue;
          }

          const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, userId, isActive: true },
            data,
            { new: true }
          );

          if (updatedAddress) {
            results.push({ addressId, success: true, data: updatedAddress });
          } else {
            results.push({ addressId, success: false, error: "Address not found" });
          }
          break;

        case 'delete':
          if (!addressId) {
            results.push({ addressId, success: false, error: "Missing addressId" });
            continue;
          }

          const deletedAddress = await Address.findOneAndUpdate(
            { _id: addressId, userId, isActive: true },
            { isActive: false },
            { new: true }
          );

          if (deletedAddress) {
            results.push({ addressId, success: true, message: "Address deleted" });
          } else {
            results.push({ addressId, success: false, error: "Address not found" });
          }
          break;

        default:
          results.push({ addressId, success: false, error: "Invalid action" });
      }
    }

    res.json({
      success: true,
      message: "Bulk operations completed",
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk operations",
      error: error.message
    });
  }
};
