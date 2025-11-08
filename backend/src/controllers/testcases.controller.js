import { supabase } from '../config/supabase.js';

// Get all test cases
export async function getTestCases(req, res) {
  try {
    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get test case by ID
export async function getTestCaseById(req, res) {
  try {
    const { testCaseId } = req.params;
    
    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('test_case_id', testCaseId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching test case:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get test cases by assignment
export async function getTestCasesByAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    
    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching test cases by assignment:', error);
    res.status(500).json({ error: error.message });
  }
}

// Create test case
export async function createTestCase(req, res) {
  try {
    const { 
      assignment_id, 
      input_data, 
      expected_output, 
      points, 
      is_public, 
      time_limit, 
      memory_limit,
      input_format,
      comparison_mode,
      tolerance
    } = req.body;

    if (!assignment_id || !input_data || !expected_output) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build insert object - use provided values or defaults
    const insertData = {
      assignment_id,
      input_data,
      expected_output,
      points: points !== undefined ? points : 10,
      is_public: is_public !== undefined ? is_public : true,
      time_limit: time_limit !== undefined ? time_limit : 2.0,
      memory_limit: memory_limit !== undefined ? memory_limit : 128000,
      input_format: input_format !== undefined && input_format !== null && input_format !== '' ? input_format : 'single',
      comparison_mode: comparison_mode !== undefined && comparison_mode !== null && comparison_mode !== '' ? comparison_mode : 'exact',
      tolerance: tolerance !== undefined ? tolerance : 0
    };

    // Debug: Log what we're trying to insert
    console.log('Inserting test case with:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('test_cases')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
    }

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating test case:', error);
    res.status(500).json({ error: error.message });
  }
}

// Update test case
export async function updateTestCase(req, res) {
  try {
    const { testCaseId } = req.params;
    const { 
      input_data, 
      expected_output, 
      points, 
      is_public, 
      time_limit, 
      memory_limit,
      input_format,
      comparison_mode,
      tolerance
    } = req.body;

    const updateData = {};

    if (input_data !== undefined) updateData.input_data = input_data;
    if (expected_output !== undefined) updateData.expected_output = expected_output;
    if (points !== undefined) updateData.points = points;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (time_limit !== undefined) updateData.time_limit = time_limit;
    if (memory_limit !== undefined) updateData.memory_limit = memory_limit;
    if (input_format !== undefined) updateData.input_format = input_format;
    if (comparison_mode !== undefined) updateData.comparison_mode = comparison_mode;
    if (tolerance !== undefined) updateData.tolerance = tolerance;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('test_cases')
      .update(updateData)
      .eq('test_case_id', testCaseId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating test case:', error);
    res.status(500).json({ error: error.message });
  }
}

// Delete test case
export async function deleteTestCase(req, res) {
  try {
    const { testCaseId } = req.params;

    const { error } = await supabase
      .from('test_cases')
      .delete()
      .eq('test_case_id', testCaseId);

    if (error) throw error;
    res.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    console.error('Error deleting test case:', error);
    res.status(500).json({ error: error.message });
  }
}

